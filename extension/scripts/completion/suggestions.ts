import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";
import { wiqlPatterns } from "../compiler/wiqlTokenPatterns";
import { getField } from "../cachedData/fields";
import { getFieldComparisonLookup } from "../wiqlErrorCheckers/TypeErrorChecker";
import { ICompletionContext, conditionSymbols } from "./completionContext";
import * as Symbols from "../compiler/wiqlSymbols";
import { getStandardFieldSuggestions, getStandardVariableSuggestions } from "./commonCompletions";
import * as Q from "q";
import { getStringValueSuggestions } from "./valueSuggestions";

function getSymbolSuggestionMap(refName: string, type: FieldType | null, fields: WorkItemField[], fieldAllowed) {
    refName = refName.toLocaleLowerCase();
    /** These symbols have their own suggestion logic */
    const excludedSymbols = [Symbols.Variable, Symbols.Field];
    if (!fieldAllowed) {
        excludedSymbols.push(Symbols.LSqBracket);
    }
    const symbolSuggestionMap: { [symbolName: string]: monaco.languages.CompletionItem } = {};
    const fieldLookup = getFieldComparisonLookup(fields);
    for (let pattern of wiqlPatterns) {
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
                kind: monaco.languages.CompletionItemKind.Keyword
            };
        }
    }
    return symbolSuggestionMap;
}

function includeKeywords(ctx: ICompletionContext, suggestions: monaco.languages.CompletionItem[]): void {
    // if right after identifier it will not have been reduced to a field yet.
    const field = ctx.prevToken instanceof Symbols.Identifier ? getField(ctx.prevToken.text, ctx.fields) : null;
    const refName = ctx.fieldRefName || (field ? field.referenceName : "");
    const symbolSuggestionMap = getSymbolSuggestionMap(refName, ctx.isInCondition ? ctx.fieldType : null, ctx.fields, ctx.isFieldAllowed);
    for (let token of ctx.parseNext.expectedTokens) {
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
    if (ctx.parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Variable)) >= 0) {
        suggestions.push(...getStandardVariableSuggestions(ctx.isInCondition ? ctx.fieldType : null));
    }
}

function isInsideString(ctx: ICompletionContext) {
    return ctx.parseNext.errorToken instanceof Symbols.NonterminatingString;
}

function pushStringSuggestions(
    ctx: ICompletionContext,
    strings: Q.IPromise<string[]>,
    suggestions: monaco.languages.CompletionItem[]
): Q.IPromise<monaco.languages.CompletionItem[]> {
    const inString = isInsideString(ctx);
    return strings.then(strings => {
        for (let str of strings) {
            suggestions.push({
                label: inString ? str : `"${str}"`,
                kind: monaco.languages.CompletionItemKind.Text
            } as monaco.languages.CompletionItem);
        }
        if (ctx.parseNext.errorToken instanceof Symbols.NonterminatingString) {
            const currentStr = ctx.parseNext.errorToken.text.substr(1);
            let charIdx = -1;
            for (let char of ". \\-:<>") {
                charIdx = Math.max(charIdx, currentStr.lastIndexOf(char));
            }
            if (charIdx >= 0) {
                const prefix = currentStr.substr(0, charIdx).toLocaleLowerCase();
                return suggestions.filter(s => s.label.toLocaleLowerCase().indexOf(prefix) === 0).map(s => {
                    return {
                        label: s.label,
                        kind: monaco.languages.CompletionItemKind.Text,
                        insertText: s.label.substr(charIdx + 1)
                    } as monaco.languages.CompletionItem;
                });
            }
        }
        return suggestions;
    });
}

/**
 * Suggestions not related to completing the currentIdentifier
 */
export function getSuggestions(
    ctx: ICompletionContext,
    position: monaco.Position
): Q.IPromise<monaco.languages.CompletionItem[]> {
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

    return Q(suggestions);
}
