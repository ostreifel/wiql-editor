import { FieldType, WorkItemField } from "TFS/WorkItemTracking/Contracts";
import { FieldLookup } from "../../cachedData/fields";
import * as Symbols from "../compiler/symbols";
import { wiqlPatterns } from "../compiler/tokenPatterns";
import { getFieldComparisonLookup } from "../errorCheckers/TypeErrorChecker";
import { getStandardFieldSuggestions, getStandardVariableSuggestions } from "./commonCompletions";
import { conditionSymbols, ICompletionContext } from "./completionContext";
import { getStringValueSuggestions } from "./valueSuggestions";

function getSymbolSuggestionMap(refName: string, type: FieldType | null, fields: FieldLookup, fieldAllowed) {
    refName = refName.toLocaleLowerCase();
    /** These symbols have their own suggestion logic */
    const excludedSymbols = [Symbols.Variable, Symbols.Field];
    if (!fieldAllowed) {
        excludedSymbols.push(Symbols.LSqBracket);
    }
    const symbolSuggestionMap: { [symbolName: string]: monaco.languages.CompletionItem } = {};
    const fieldLookup = getFieldComparisonLookup(fields);
    for (const pattern of wiqlPatterns) {
        if (typeof pattern.match === "string" &&
            excludedSymbols.indexOf(pattern.token) < 0 &&
            (!pattern.valueTypes || type === null || pattern.valueTypes.indexOf(type) >= 0) &&
            (conditionSymbols.indexOf(pattern.token) < 0 || !refName || !(refName in fieldLookup) ||
                (fieldLookup[refName].field.indexOf(pattern.token) >= 0 ||
                    fieldLookup[refName].literal.indexOf(pattern.token) >= 0 ||
                    fieldLookup[refName].group.indexOf(pattern.token) >= 0))
        ) {
            const symName = Symbols.getSymbolName(pattern.token);
            symbolSuggestionMap[symName] = {
                label: pattern.match,
                kind: monaco.languages.CompletionItemKind.Keyword,
            };
        }
    }
    return symbolSuggestionMap;
}

function includeKeywords(ctx: ICompletionContext, suggestions: monaco.languages.CompletionItem[]): void {
    // if right after identifier it will not have been reduced to a field yet.
    const field = ctx.prevToken instanceof Symbols.Identifier ? ctx.fields.getField(ctx.prevToken.text) : null;
    const refName = ctx.fieldRefName || (field ? field.referenceName : "");
    const symbolSuggestionMap = getSymbolSuggestionMap(refName, ctx.isInCondition ? ctx.fieldType : null, ctx.fields, ctx.isFieldAllowed);
    for (const token of ctx.parseNext.expectedTokens) {
        if (symbolSuggestionMap[token]) {
            // TODO filter by value type symbols by type
            suggestions.push(symbolSuggestionMap[token]);
        }
    }
}
function includeFields(ctx: ICompletionContext, suggestions: monaco.languages.CompletionItem[]): void {
    if (ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Identifier)) >= 0 && ctx.isFieldAllowed) {
        let fieldSuggestions = getStandardFieldSuggestions(ctx.fields, ctx.isInCondition ? ctx.fieldType : null);
        if (!(ctx.prevToken instanceof Symbols.LSqBracket)) {
            fieldSuggestions = fieldSuggestions.filter((s) => s.label.indexOf(" ") < 0);
        }
        suggestions.push(...fieldSuggestions);
    }
}
function includeVariables(ctx: ICompletionContext, suggestions: monaco.languages.CompletionItem[]): void {
    if (ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Variable)) >= 0 &&
        !(ctx.prevToken instanceof Symbols.Group)) {
        suggestions.push(...getStandardVariableSuggestions(ctx.isInCondition ? ctx.fieldType : null));
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
    position: monaco.Position,
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
