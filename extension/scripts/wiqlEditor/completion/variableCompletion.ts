import { FieldType } from "TFS/WorkItemTracking/Contracts";

import * as Symbols from "../compiler/symbols";
import { definedVariables } from "../wiqlDefinition";
import { ICompletionContext } from "./completionContext";

export function getStandardVariableCompletions(type: FieldType | null) {
    const completions: monaco.languages.CompletionItem[] = [];
    for (const variable in definedVariables) {
        if (type === null || definedVariables[variable] === type) {
            completions.push({
                label: variable,
                kind: monaco.languages.CompletionItemKind.Variable,
            } as monaco.languages.CompletionItem);
        }
    }
    return completions;
}

export function getVariableCompletions(ctx: ICompletionContext): monaco.languages.CompletionItem[] {
    if (ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Variable)) >= 0 &&
        !(ctx.prevToken instanceof Symbols.Group)) {
        return getStandardVariableCompletions(ctx.isInCondition ? ctx.fieldType : null);
    }
    return [];
}

export async function getCurrentVariableCompletions(ctx: ICompletionContext, position: monaco.Position): Promise<monaco.languages.CompletionItem[]> {
    if (ctx.prevToken instanceof Symbols.Variable
        && position.column - 1 === ctx.prevToken.endColumn) {
        return getStandardVariableCompletions(ctx.isInCondition ? ctx.fieldType : null).map((s) => {
            return {
                label: s.label,
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: s.label.replace("@", ""),
            } as monaco.languages.CompletionItem;
        });
    }
    return [];
}
