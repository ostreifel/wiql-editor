import { projectsVal } from "../../cachedData/projects";
import { getTeams } from "../../cachedData/teams";
import * as Symbols from "../compiler/symbols";
import { ICompletionContext } from "./completionContext";
import { isInVariable, IVariableContext } from "./isIn";
import { pushStringCompletions } from "./pushStringCompletions";

async function getCurrentIterationParmeterCompletions(ctx: ICompletionContext, {args}: IVariableContext): Promise<string[]> {
    if (!args || args.length !== 0) {
        return [];
    }
    const projects = (await projectsVal.getValue()).map(({name}) => name);
    const teamArg = ctx.parseNext.errorToken.text;
    if (!(ctx.parseNext.errorToken instanceof Symbols.NonterminatingString) || !teamArg || teamArg.match(/^['"]$/)) {
        return projects.map((p) => `[${p}]`);
    }
    const teamMatch = teamArg.match(/^['"]\[(.+)\]\\(.*)$/);
    if (!teamMatch) {
        return [];
    }
    const [, project] = teamMatch;
    const lower = (s: string) => s.toLocaleLowerCase();
    if (projects.map(lower).indexOf(lower(project)) < 0) {
        return [];
    }
    const teams = await getTeams(lower(project));
    return teams.map(({name}) => name);
}

export async function getVariableParameterCompletions(ctx: ICompletionContext): Promise<monaco.languages.CompletionItem[]> {
    const completions: monaco.languages.CompletionItem[] = [];
    const varCtx = isInVariable(ctx);
    if (!varCtx) {
        return completions;
    }
    const strings: string[] = [];
    switch (varCtx.name.toLocaleLowerCase()) {
        case "@currentiteration":
        strings.push(...await getCurrentIterationParmeterCompletions(ctx, varCtx));
        break;
    }

    pushStringCompletions(ctx, strings, completions);
    return completions;
}
