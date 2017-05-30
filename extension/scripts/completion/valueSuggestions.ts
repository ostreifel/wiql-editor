import { ICompletionContext } from "./completionContext";
import { isIdentityField, identities } from "../cachedData/identities";
import { projects } from "../cachedData/projects";
import { states, witNames, getWitsByProjects } from "../cachedData/workItemTypes";
import { iterationStrings, areaStrings } from "../cachedData/nodes";
import { tags } from "../cachedData/tags";
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
                conditionals.push(logical.condition);
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
        throw new Error("Value is unexpected type when completing");
    });
}


function getFilters(ctx: ICompletionContext, parse: IParseResults) {
    const projects: string[] = [];
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

    }
    return { projects };
}

function getWitSuggestions(ctx: ICompletionContext): Q.IPromise<string[]> {
    const { projects: projectStrings } = getFilters(ctx, ctx.getAssumedParse());
    if (projectStrings.length === 0) {
        return witNames.getValue();
    }
    return projects.getValue().then(projects => {
        // Correct for casing and existence of project names
        const projectMap: {[key: string]: string} = {};
        for (const { name } of projects) {
            projectMap[name.toLocaleLowerCase()] = name;
        }
        const uniqueProjectsSet: {[name: string]: void} = {};
        for (const project of projectStrings) {
            const projectName = projectMap[project.toLocaleLowerCase()];
            if (projectName && !(projectName in uniqueProjectsSet)) {
                uniqueProjectsSet[projectName] = void 0;
            }
        }

        const uniqueProjects = Object.keys(uniqueProjectsSet);
        return getWitsByProjects(uniqueProjects);
    });
}

export function getStringValueSuggestions(ctx: ICompletionContext): Q.IPromise<string[]> {
    const expectingString = ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.String)) >= 0;
    if (isIdentityField(ctx.fields, ctx.fieldRefName) && expectingString) {
        return identities.getValue();
    } else if (equalFields("System.TeamProject", ctx.fieldRefName, ctx.fields) && expectingString) {
        return projects.getValue().then(projs => projs.map(p => p.name));
    } else if (equalFields("System.State", ctx.fieldRefName, ctx.fields) && expectingString) {
        return states.getValue();
    } else if (equalFields("System.WorkItemType", ctx.fieldRefName, ctx.fields) && expectingString) {
        return getWitSuggestions(ctx);
    } else if (equalFields("System.AreaPath", ctx.fieldRefName, ctx.fields) && expectingString) {
        return areaStrings.getValue();
    } else if (equalFields("System.IterationPath", ctx.fieldRefName, ctx.fields) && expectingString) {
        return iterationStrings.getValue();
    } else if (equalFields("System.Tags", ctx.fieldRefName, ctx.fields) && expectingString) {
        return tags.getValue();
    }
    return Q([]);
}
