import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";
import { wiqlPatterns } from "./compiler/wiqlTokenPatterns";
import * as Symbols from "./compiler/wiqlSymbols";
import { parse, ParseError } from "./compiler/wiqlParser";
import { definedVariables } from "./wiqlDefinition";
import { isIdentityField, identities } from "./cachedData/identities";

function getSymbolSuggestionMap(type: FieldType | null) {
    /** These symbols have their own suggestion logic */
    const excludedSymbols = [Symbols.Variable, Symbols.Field];
    const symbolSuggestionMap: { [symbolName: string]: monaco.languages.CompletionItem } = {};
    for (let pattern of wiqlPatterns) {
        if (typeof pattern.match === "string" &&
            excludedSymbols.indexOf(pattern.token) < 0 &&
            (!pattern.valueTypes || type === null || pattern.valueTypes.indexOf(type) >= 0)) {
            const symName = Symbols.getSymbolName(pattern.token);
            symbolSuggestionMap[symName] = {
                label: pattern.match,
                kind: monaco.languages.CompletionItemKind.Keyword
            };
        }
    }
    return symbolSuggestionMap;
}
function getFieldSuggestions(fields: WorkItemField[], type: FieldType | null): monaco.languages.CompletionItem[] {
    const matchingFields = fields.filter(f => type === null || type === f.type);
    return matchingFields.map(f => {return {
        label: f.referenceName,
        kind: monaco.languages.CompletionItemKind.Variable
    } as monaco.languages.CompletionItem; }).concat(matchingFields.map(f => {return {
        label: f.name,
        kind: monaco.languages.CompletionItemKind.Variable
    } as monaco.languages.CompletionItem; }));
}
function getVariables(type: FieldType | null) {
    const suggestions: monaco.languages.CompletionItem[] = [];
    for (let variable in definedVariables) {
        if (type === null || definedVariables[variable] === type) {
            suggestions.push({
                label: variable,
                kind: monaco.languages.CompletionItemKind.Variable
            } as monaco.languages.CompletionItem);
        }
    }
    return suggestions;
}
/**
 * Whether the given token is the final token of a conditional symbol.
 * Ideally the compilier would be able to tell us which productions it was currently parsing - this is just a workaround.
 * @param symbol
 */
function isConditionToken(symbol: Symbols.Symbol) {
    return symbol instanceof Symbols.Equals ||
        symbol instanceof Symbols.NotEquals ||
        symbol instanceof Symbols.LessThan ||
        symbol instanceof Symbols.LessOrEq ||
        symbol instanceof Symbols.GreaterThan ||
        symbol instanceof Symbols.GreaterOrEq ||
        symbol instanceof Symbols.Like ||
        symbol instanceof Symbols.Under ||
        symbol instanceof Symbols.Contains ||
        symbol instanceof Symbols.Words ||
        symbol instanceof Symbols.Group ||
        symbol instanceof Symbols.Ever;
}
export const getCompletionProvider: (fields: WorkItemField[]) => monaco.languages.CompletionItemProvider = (fields) => {
    return {
        triggerCharacters: [" ", "[", ".", "@", "\"" , "'"],
        provideCompletionItems: (model, position, token) => {
            const lines = model.getLinesContent().slice(0, position.lineNumber);
            if (lines.length > 0) {
                lines[lines.length - 1] = lines[lines.length - 1].substr(0, position.column - 1);
            }
            const parseResult = parse(lines);
            // if asof has value don't suggest, otherwise suggest thinks its in an expression
            if (parseResult instanceof Symbols.FlatSelect && parseResult.asOf) {
                return [];
            }

            const parseNext = parse(lines, true);
            console.log(parseNext);
            if (!(parseNext instanceof ParseError) || parseNext.remainingTokens.length > 2) {
                // valid query, can't suggest
                return [];
            }
            const parsedCount = parseNext.parsedTokens.length;
            const prevToken = parseNext.parsedTokens[parsedCount - 1];

            const prev2 = parseNext.parsedTokens[parsedCount - 2];
            const prev3 = parseNext.parsedTokens[parsedCount - 3];
            const fieldSymbol = prev2 instanceof Symbols.Field ? prev2 : prev3 instanceof Symbols.Field ? prev3 : null;
            const refOrName = fieldSymbol && fieldSymbol.identifier.text.toLocaleLowerCase();
            const [fieldInstance] = fields.filter(f =>
                f.name.toLocaleLowerCase() === refOrName ||
                f.referenceName.toLocaleLowerCase() === refOrName);
            const type = fieldInstance && fieldInstance.type;
            const inCondition = isConditionToken(prevToken);
            if (prevToken instanceof Symbols.Identifier
                && position.column - 1 === prevToken.endColumn) {
                // In process of typing field name
                // (parser just consumes this becuase it doesn't know which fields are valid)
                let suggestions: monaco.languages.CompletionItem[] = getFieldSuggestions(fields, inCondition ? type : null);
                if (!(prev2 instanceof Symbols.LSqBracket)) {
                    suggestions = suggestions.filter((s) => s.label.indexOf(" ") < 0);
                }
                const spaceIdx = prevToken.text.lastIndexOf(" ");
                const dotIdx = prevToken.text.lastIndexOf(".");
                const charIdx = Math.max(spaceIdx, dotIdx);
                if (charIdx >= 0) {
                    const prefix = prevToken.text.substr(0, charIdx + 1).toLocaleLowerCase();
                    suggestions = suggestions.filter((s) => s.label.toLocaleLowerCase().indexOf(prefix) === 0)
                        .map((s) => {
                            return {
                                label: s.label,
                                kind: monaco.languages.CompletionItemKind.Variable,
                                insertText: s.label.substr(charIdx + 1)
                            };
                        });
                }
                return suggestions;
            } else if (prevToken instanceof Symbols.Variable
                && position.column - 1 === prevToken.endColumn) {
                return getVariables(inCondition ? type : null).map(s => {return {
                    label: s.label,
                    kind: monaco.languages.CompletionItemKind.Variable,
                    insertText: s.label.replace("@", "")
                } as monaco.languages.CompletionItem; });
            } else {
                const suggestions: monaco.languages.CompletionItem[] = [];
                // Don't complete inside strings
                if (!(parseNext.errorToken instanceof Symbols.NonterminatingString)) {
                    const symbolSuggestionMap = getSymbolSuggestionMap(inCondition ? type : null);
                    // Include keywords
                    for (let token of parseNext.expectedTokens) {
                        if (symbolSuggestionMap[token]) {
                            // TODO filter by value type symbols by type
                            suggestions.push(symbolSuggestionMap[token]);
                        }
                    }
                    // Include field and variables
                    if (parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Identifier)) >= 0) {
                        let fieldSuggestions = getFieldSuggestions(fields, inCondition ? type : null);
                        if (!(prevToken instanceof Symbols.LSqBracket)) {
                            fieldSuggestions = fieldSuggestions.filter((s) => s.label.indexOf(" ") < 0);
                        }
                        suggestions.push(...fieldSuggestions);
                    }
                    if (parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Variable)) >= 0) {
                        suggestions.push(...getVariables(inCondition ? type : null));
                    }
                }
                // Identities
                if (fieldSymbol instanceof Symbols.Field &&
                    isIdentityField(fields, fieldSymbol.identifier.text) &&
                    parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.String)) >= 0) {
                    const inString = parseNext.errorToken instanceof Symbols.NonterminatingString;
                    return identities.getValue().then(identities => {
                        suggestions.push(...identities.map(name => {return {
                            label: inString ? name : `"${name}"`,
                            kind: monaco.languages.CompletionItemKind.Text
                        } as monaco.languages.CompletionItem; }));
                        return suggestions;
                    });
                }

                return suggestions;
            }
        }
    };
};
