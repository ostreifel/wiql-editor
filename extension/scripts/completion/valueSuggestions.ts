import { ICompletionContext } from "./completionContext";
import { isIdentityField, identities } from "../cachedData/identities";
import { projects } from "../cachedData/projects";
import { states, witNames, getWitNamesByProjects, getStatesByProjects } from "../cachedData/workItemTypes";
import { iterationStrings, areaStrings } from "../cachedData/nodes";
import { getTagsForProjects } from "../cachedData/tags";
import { equalFields } from "../cachedData/fields";
import * as Q from "q";
import * as Symbols from "../compiler/wiqlSymbols";
import { IParseResults } from "../compiler/wiqlParser";

function getConditionalExpressions(logical: Symbols.LogicalExpression) {
    const conditionals: Symbols.ConditionalExpression[] = [];
    let curr: Symbols.LogicalExpression | undefined = logical;
    while (curr) {
        if (curr.condition) {
            if (curr.condition.expression) {
                conditionals.push(...getConditionalExpressions(curr.condition.expression));
            } else if (curr.orAnd instanceof Symbols.Or) {
                /*
                All "or" statments are untrustworthy

                exp1 and (exp3 or exp3) => [exp1] + ([])
                */
                return [];
            } else {
                conditionals.push(curr.condition);
            }
        }
        curr = curr.expression;
    }
    return conditionals;
}

function getProjects(ctx: ICompletionContext, conditionals: Symbols.ConditionalExpression[]): string[] {
    const projectConditions = conditionals.filter(c => c.field && equalFields("System.TeamProject", c.field.identifier.text, ctx.fields));
    if (projectConditions.some(c =>
        !c.conditionalOperator ||
        !(c.conditionalOperator.conditionToken instanceof Symbols.Equals) ||
        (
            !(c.value && c.value.value instanceof Symbols.String) &&
            !(c.value && c.value.value instanceof Symbols.Variable)
        ))) {
        return [];
    }
    return projectConditions.map(c => {
        if (c.value && c.value.value instanceof Symbols.String) {
            const str = c.value.value.text;
            // Remove the quotes on the string text
            return str.substr(1, str.length - 2);
        } else if (c.value && c.value.value instanceof Symbols.Variable) {
            return VSS.getWebContext().project.name;
        }
        throw new Error("Value is unexpected type reading projects");
    });
}

function getWits(ctx: ICompletionContext, conditionals: Symbols.ConditionalExpression[]): string[] {
    const witConditions = conditionals.filter(c => c.field && equalFields("System.WorkItemType", c.field.identifier.text, ctx.fields));
    if (witConditions.some(c =>
        !c.conditionalOperator ||
        // TODO also allow in group
        !(c.conditionalOperator.conditionToken instanceof Symbols.Equals) ||
        !(c.value && c.value.value instanceof Symbols.String)
    )) {
        return [];
    }
    return witConditions.map(c => {
        if (c.value && c.value.value instanceof Symbols.String) {
            const str = c.value.value.text;
            // Remove the quotes on the string text
            return str.substr(1, str.length - 2);
        }
        throw new Error("Value is unexpected type when reading wits");
    });
}


function getFilters(ctx: ICompletionContext, parse: IParseResults) {
    const projects: string[] = [];
    const wits: string[] = [];
    if (
        (
            parse instanceof Symbols.FlatSelect ||
            parse instanceof Symbols.OneHopSelect ||
            parse instanceof Symbols.RecursiveSelect
        ) &&
        parse.whereExp
    ) {
        const conditionalExpressions = getConditionalExpressions(parse.whereExp);
        projects.push(...getProjects(ctx, conditionalExpressions));
        wits.push(...getWits(ctx, conditionalExpressions));

    }
    return { projects, wits };
}

function toServerCasing(values: string[], serverValues: Q.IPromise<string[]>): Q.IPromise<string[]> {
    return serverValues.then(serverValues => {
        const serverValueMap: { [key: string]: string } = {};
        for (const serverValue of serverValues) {
            serverValueMap[serverValue.toLocaleLowerCase()] = serverValue;
        }
        const uniqueValues: { [name: string]: void } = {};
        for (const value of values) {
            const properValue = serverValueMap[value.toLocaleLowerCase()];
            if (properValue && !(properValue in uniqueValues)) {
                uniqueValues[properValue] = void 0;
            }
        }
        return Object.keys(uniqueValues);
    });
}

function getWitSuggestions(ctx: ICompletionContext): Q.IPromise<string[]> {
    const { projects: projectStrings } = getFilters(ctx, ctx.getAssumedParse());
    if (projectStrings.length === 0) {
        return witNames.getValue();
    }
    return toServerCasing(projectStrings, projects.getValue()
        .then(projects => projects.map(p => p.name)))
        .then(projects => getWitNamesByProjects(projects));
}

function getStateSuggestions(ctx: ICompletionContext): Q.IPromise<string[]> {
    const {
        projects: projectStrings,
        wits: witStrings
    } = getFilters(ctx, ctx.getAssumedParse());


    return toServerCasing(projectStrings, projects.getValue()
        .then(projects => projects.map(p => p.name)))
        .then(projects =>
            toServerCasing(witStrings, getWitNamesByProjects(projects))
                .then(wits => getStatesByProjects(projects, wits))
        );
}

function getTagSuggestions(ctx: ICompletionContext) {
    const { projects: projectStrings } = getFilters(ctx, ctx.getAssumedParse());
    return toServerCasing(projectStrings, projects.getValue()
        .then(projects => projects.map(p => p.name)))
        .then(projectNames => projects.getValue().then(projects => {
            const projMap: { [name: string]: /* id: */ string } = {};
            for (const project of projects) {
                projMap[project.name] = project.id;
            }
            return getTagsForProjects(projectNames.map(name => projMap[name]));
        }));
}

export function getStringValueSuggestions(ctx: ICompletionContext): Q.IPromise<string[]> {
    const expectingString = ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.String)) >= 0;
    if (isIdentityField(ctx.fields, ctx.fieldRefName) && expectingString) {
        return identities.getValue();
    } else if (equalFields("System.TeamProject", ctx.fieldRefName, ctx.fields) && expectingString) {
        return projects.getValue().then(projs => projs.map(p => p.name));
    } else if (equalFields("System.State", ctx.fieldRefName, ctx.fields) && expectingString) {
        return getStateSuggestions(ctx);
    } else if (equalFields("System.WorkItemType", ctx.fieldRefName, ctx.fields) && expectingString) {
        return getWitSuggestions(ctx);
    } else if (equalFields("System.AreaPath", ctx.fieldRefName, ctx.fields) && expectingString) {
        return areaStrings.getValue();
    } else if (equalFields("System.IterationPath", ctx.fieldRefName, ctx.fields) && expectingString) {
        return iterationStrings.getValue();
    } else if (equalFields("System.Tags", ctx.fieldRefName, ctx.fields) && expectingString) {
        return getTagSuggestions(ctx);
    }
    return Q([]);
}
