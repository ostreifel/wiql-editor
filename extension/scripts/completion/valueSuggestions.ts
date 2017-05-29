import { ICompletionContext } from "./completionContext";
import { isIdentityField, identities } from "../cachedData/identities";
import { projects } from "../cachedData/projects";
import { states, witNames } from "../cachedData/workItemTypes";
import { iterationStrings, areaStrings } from "../cachedData/nodes";
import { tags } from "../cachedData/tags";
import { equalFields } from "../cachedData/fields";
import * as Q from "q";
import * as Symbols from "../compiler/wiqlSymbols";

export function getStringValueSuggestions(ctx: ICompletionContext): Q.IPromise<string[]> {
    const expectingString = ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.String)) >= 0;
    if (isIdentityField(ctx.fields, ctx.fieldRefName) && expectingString) {
        return identities.getValue();
    } else if (equalFields("System.TeamProject", ctx.fieldRefName, ctx.fields) && expectingString) {
        return projects.getValue().then(projs => projs.map(p => p.name));
    } else if (equalFields("System.State", ctx.fieldRefName, ctx.fields) && expectingString) {
        return states.getValue();
    } else if (equalFields("System.WorkItemType", ctx.fieldRefName, ctx.fields) && expectingString) {
        return witNames.getValue();
    } else if (equalFields("System.AreaPath", ctx.fieldRefName, ctx.fields) && expectingString) {
        return areaStrings.getValue();
    } else if (equalFields("System.IterationPath", ctx.fieldRefName, ctx.fields) && expectingString) {
        return iterationStrings.getValue();
    } else if (equalFields("System.Tags", ctx.fieldRefName, ctx.fields) && expectingString) {
        return tags.getValue();
    }
    return Q([]);
}
