import { ICompletionContext } from "./completionContext";
import { isIdentityField, identities } from "../../cachedData/identities";
import { projectsVal } from "../../cachedData/projects";
import { relationTypes } from "../../cachedData/relationTypes";
import { witNames, getWitNamesByProjects, getStatesByProjects } from "../../cachedData/workItemTypes";
import { iterationStrings, areaStrings } from "../../cachedData/nodes";
import { getTagsForProjects } from "../../cachedData/tags";
import { getCategories } from "../../cachedData/workitemTypeCategories";
import * as Symbols from "../compiler/symbols";
import { IParseResults } from "../compiler/parser";
import { getFilters } from "../parseAnalysis/whereClauses";

async function getWitSuggestions(ctx: ICompletionContext): Promise<string[]> {
    const { projects } = await getFilters(ctx.getAssumedParse());
    if (ctx.prevToken instanceof Symbols.Group) {
        const categories = await getCategories(projects);
        return categories.map(c => c.referenceName);
    } else {
        if (projects.length === 0) {
            return witNames.getValue();
        }
        return getWitNamesByProjects(projects);
    }
}

async function getStateSuggestions(ctx: ICompletionContext): Promise<string[]> {
    const { projects, workItemTypes } = await getFilters(ctx.getAssumedParse());
    if (projects.length === 0) {
        return witNames.getValue();
    }
    return getStatesByProjects(projects, workItemTypes);
}

async function getTagSuggestions(ctx: ICompletionContext) {
    const { projects, workItemTypes } = await getFilters(ctx.getAssumedParse())
    if (projects.length === 0) {
        return witNames.getValue();
    }
    return getTagsForProjects(projects);
}

export async function getStringValueSuggestions(ctx: ICompletionContext): Promise<string[]> {
    const expectingString = ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.String)) >= 0;
    if (isIdentityField(ctx.fields, ctx.fieldRefName) && expectingString) {
        return identities.getValue();
    } else if (ctx.fields.equalFields("System.TeamProject", ctx.fieldRefName) && expectingString) {
        const projects = await projectsVal.getValue();
        return projects.map(({name}) => name);
    } else if (ctx.fields.equalFields("System.State", ctx.fieldRefName) && expectingString) {
        return getStateSuggestions(ctx);
    } else if (ctx.fields.equalFields("System.WorkItemType", ctx.fieldRefName) && expectingString) {
        return getWitSuggestions(ctx);
    } else if (ctx.fields.equalFields("System.AreaPath", ctx.fieldRefName) && expectingString) {
        return areaStrings.getValue();
    } else if (ctx.fields.equalFields("System.IterationPath", ctx.fieldRefName) && expectingString) {
        return iterationStrings.getValue();
    } else if (ctx.fields.equalFields("System.Tags", ctx.fieldRefName) && expectingString) {
        return getTagSuggestions(ctx);
    } else if (ctx.fields.equalFields("System.Links.LinkType", ctx.fieldRefName) && expectingString) {
        const types = await relationTypes.getValue();
        return types.filter(t => t.attributes["usage"] === "workItemLink").map(t => t.referenceName);
    }
    return [];
}
