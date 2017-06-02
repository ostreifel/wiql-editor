import { ICompletionContext } from "./completionContext";
import { isIdentityField, identities } from "../../cachedData/identities";
import { projects } from "../../cachedData/projects";
import { witNames, getWitNamesByProjects, getStatesByProjects } from "../../cachedData/workItemTypes";
import { iterationStrings, areaStrings } from "../../cachedData/nodes";
import { getTagsForProjects } from "../../cachedData/tags";
import { equalFields } from "../../cachedData/fields";
import * as Q from "q";
import * as Symbols from "../compiler/wiqlSymbols";
import { IParseResults } from "../compiler/wiqlParser";
import { getFilters } from "../parseAnalysis/whereClauses";

function getWitSuggestions(ctx: ICompletionContext): Q.IPromise<string[]> {
    return getFilters(ctx.getAssumedParse()).then(({projects}) => {
        if (projects.length === 0) {
                return witNames.getValue();
        }
        return getWitNamesByProjects(projects);
    });
}

function getStateSuggestions(ctx: ICompletionContext): Q.IPromise<string[]> {
    return getFilters(ctx.getAssumedParse()).then(({projects, workItemTypes}) => {
        if (projects.length === 0) {
                return witNames.getValue();
        }
        return getStatesByProjects(projects, workItemTypes);
    });
}

function getTagSuggestions(ctx: ICompletionContext) {
    return getFilters(ctx.getAssumedParse()).then(({projects, workItemTypes}) => {
        if (projects.length === 0) {
                return witNames.getValue();
        }
        return getTagsForProjects(projects);
    });
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
