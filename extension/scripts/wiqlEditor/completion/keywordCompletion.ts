import { FieldType } from "TFS/WorkItemTracking/Contracts";

import { FieldLookup } from "../../cachedData/fields";
import * as Symbols from "../compiler/symbols";
import { wiqlPatterns } from "../compiler/tokenPatterns";
import { getFieldComparisonLookup } from "../errorCheckers/TypeErrorChecker";
import { conditionSymbols, ICompletionContext } from "./completionContext";

interface ISymbolSuggestionMap {
    [symbolName: string]: monaco.languages.CompletionItem;
}
function getSymbolSuggestionMap(
    refName: string,
    type: FieldType | null,
    fields: FieldLookup,
    isFieldAllowed: boolean,
): ISymbolSuggestionMap {
    refName = refName.toLocaleLowerCase();
    /** These symbols have their own suggestion logic */
    const excludedSymbols = [Symbols.Variable, Symbols.Field];
    if (!isFieldAllowed) {
        excludedSymbols.push(Symbols.LSqBracket);
    }
    const symbolSuggestionMap: ISymbolSuggestionMap = {};
    const fieldLookup = getFieldComparisonLookup(fields);
    for (const pattern of wiqlPatterns) {
        if (typeof pattern.match === "string" &&
            pattern.token &&
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

function getLastVar(ctx: ICompletionContext): string {
    for (const token of ctx.parsedTokens) {
        if (token instanceof Symbols.Variable) {
            return token.text;
        }
    }
    return "";
}

function isBlockedVarToken(lastVar: string, token: string) {
    const offsetVars: {[token: string]: boolean} = {
        "@currentiteration": true,
        "@today": true,
    };
    const parameterVars: {[token: string]: boolean} = {
        "@currentiteration": true,
        "@teamareas": true,
    };
    const offsetTokens: {[token: string]: boolean} = {
        Minus: true,
        Plus: true,
    };
    lastVar = lastVar.toLocaleLowerCase();
    return !offsetVars[lastVar] && offsetTokens[token] || !parameterVars[lastVar] && token === "LParen";
}

export function includeKeywords(ctx: ICompletionContext, suggestions: monaco.languages.CompletionItem[]): void {
    // if right after identifier it will not have been reduced to a field yet.
    const field = ctx.prevToken instanceof Symbols.Identifier ? ctx.fields.getField(ctx.prevToken.text) : null;
    const refName = ctx.fieldRefName || (field ? field.referenceName : "");
    const symbolSuggestionMap = getSymbolSuggestionMap(refName, ctx.isInCondition ? ctx.fieldType : null, ctx.fields, ctx.isFieldAllowed);
    const lastVar = getLastVar(ctx);
    for (const token of ctx.parseNext.expectedTokens) {
        if (
            !isBlockedVarToken(lastVar, token) &&
            symbolSuggestionMap[token]
        ) {
            // TODO filter by value type symbols by type
            suggestions.push(symbolSuggestionMap[token]);
        }
    }
}
