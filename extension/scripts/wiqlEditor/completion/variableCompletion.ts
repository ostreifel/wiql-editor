import { FieldType } from "TFS/WorkItemTracking/Contracts";

import * as Symbols from "../compiler/symbols";
import { definedVariables } from "../wiqlDefinition";
import { ICompletionContext } from "./completionContext";

export function getStandardVariableSuggestions(type: FieldType | null) {
    const suggestions: monaco.languages.CompletionItem[] = [];
    for (const variable in definedVariables) {
        if (type === null || definedVariables[variable] === type) {
            suggestions.push({
                label: variable,
                kind: monaco.languages.CompletionItemKind.Variable,
            } as monaco.languages.CompletionItem);
        }
    }
    return suggestions;
}

export function includeVariables(ctx: ICompletionContext, suggestions: monaco.languages.CompletionItem[]): void {
    if (ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Variable)) >= 0 &&
        !(ctx.prevToken instanceof Symbols.Group)) {
        suggestions.push(...getStandardVariableSuggestions(ctx.isInCondition ? ctx.fieldType : null));
    }
}
