import * as Symbols from "../compiler/symbols";
import { ICompletionContext } from "./completionContext";
import { getStandardFieldSuggestions } from "./fieldCompletion";
import { includeKeywords } from "./keywordCompletion";
import { getStringValueSuggestions } from "./valueSuggestions";
import { includeVariables } from "./variableCompletion";

function includeFields(ctx: ICompletionContext, suggestions: monaco.languages.CompletionItem[]): void {
    if (ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Identifier)) >= 0 && ctx.isFieldAllowed) {
        let fieldSuggestions = getStandardFieldSuggestions(ctx.fields, ctx.isInCondition ? ctx.fieldType : null);
        if (!(ctx.prevToken instanceof Symbols.LSqBracket)) {
            fieldSuggestions = fieldSuggestions.filter((s) => s.label.indexOf(" ") < 0);
        }
        suggestions.push(...fieldSuggestions);
    }
}

function isInsideString(ctx: ICompletionContext) {
    return ctx.parseNext.errorToken instanceof Symbols.NonterminatingString;
}

async function pushStringSuggestions(
    ctx: ICompletionContext,
    stringsPromise: PromiseLike<string[]>,
    suggestions: monaco.languages.CompletionItem[],
): Promise<monaco.languages.CompletionItem[]> {
    const inString = isInsideString(ctx);
    const strings = await stringsPromise;
    for (const str of strings) {
        suggestions.push({
            label: inString ? str : `"${str}"`,
            kind: monaco.languages.CompletionItemKind.Text,
        } as monaco.languages.CompletionItem);
    }
    if (ctx.parseNext.errorToken instanceof Symbols.NonterminatingString) {
        const currentStr = ctx.parseNext.errorToken.text.substr(1);
        let charIdx = -1;
        for (const char of ". \\-:<>") {
            charIdx = Math.max(charIdx, currentStr.lastIndexOf(char));
        }
        if (charIdx >= 0) {
            const prefix = currentStr.substr(0, charIdx).toLocaleLowerCase();
            return suggestions.filter((s) => s.label.toLocaleLowerCase().indexOf(prefix) === 0).map((s) =>
                ({
                    label: s.label,
                    kind: monaco.languages.CompletionItemKind.Text,
                    insertText: s.label.substr(charIdx + 1),
                } as monaco.languages.CompletionItem),
            );
        }
    }
    return suggestions;
}

/**
 * Suggestions not related to completing the currentIdentifier
 */
export async function getSuggestions(
    ctx: ICompletionContext,
    // position: monaco.Position,
): Promise<monaco.languages.CompletionItem[]> {
    const suggestions: monaco.languages.CompletionItem[] = [];
    // Don't symbols complete inside strings
    if (!isInsideString(ctx)) {
        includeKeywords(ctx, suggestions);
        includeFields(ctx, suggestions);
        includeVariables(ctx, suggestions);
    }
    // Field Values
    if (ctx.fieldRefName && ctx.isInCondition) {
        const values = getStringValueSuggestions(ctx);
        return pushStringSuggestions(ctx, values, suggestions);
    }

    return suggestions;
}
