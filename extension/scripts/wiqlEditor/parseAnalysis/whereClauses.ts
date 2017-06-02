import { ICompletionContext } from "../completion/completionContext";
import * as Symbols from "../compiler/symbols";
import { equalFields, fields } from "../../cachedData/fields";
import { IParseResults } from "../compiler/parser";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import { projects } from "../../cachedData/projects";
import { states, witNames, getWitNamesByProjects, getStatesByProjects } from "../../cachedData/workItemTypes";

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

function getProjects(fields: WorkItemField[], conditionals: Symbols.ConditionalExpression[]): string[] {
    const projectConditions = conditionals.filter(c => c.field && equalFields("System.TeamProject", c.field.identifier.text, fields));
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

function getWits(fields: WorkItemField[], conditionals: Symbols.ConditionalExpression[]): string[] {
    const witConditions = conditionals.filter(c => c.field && equalFields("System.WorkItemType", c.field.identifier.text, fields));
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



function toServerCasing(values: string[], serverValues: string[]): string[] {
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
}

export interface IQueryFilters {
    projects: string[];
    workItemTypes: string[];
}

export function getFilters(parse: IParseResults): Q.IPromise<IQueryFilters> {
    return fields.getValue().then(fields => {
        const foundProjects: string[] = [];
        const foundWits: string[] = [];
        if (
            (
                parse instanceof Symbols.FlatSelect ||
                parse instanceof Symbols.OneHopSelect ||
                parse instanceof Symbols.RecursiveSelect
            ) &&
            parse.whereExp
        ) {
            const conditionalExpressions = getConditionalExpressions(parse.whereExp);
            foundProjects.push(...getProjects(fields, conditionalExpressions));
            foundWits.push(...getWits(fields, conditionalExpressions));

        }

        return projects.getValue().then(projects => {
            const projectNames = projects.map(p => p.name);
            const uniqueProjects = toServerCasing(foundProjects, projectNames);
            return getWitNamesByProjects(uniqueProjects).then(witNames => {
                const uniqueWits = toServerCasing(foundWits, witNames);
                const filters: IQueryFilters = {
                    projects: uniqueProjects,
                    workItemTypes: uniqueWits
                };
                return filters;
            })
        });
    });
}
