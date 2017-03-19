import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";
import { wiqlPatterns } from "./compiler/wiqlTokenPatterns";
import * as Symbols from "./compiler/wiqlSymbols";
import { parse, ParseError } from "./compiler/wiqlParser";
import { definedVariables } from "./wiqlDefinition";
import { isIdentityField, identities } from "./cachedData/identities";
import { equalFields, getField } from "./cachedData/fields";
import { states, witNames } from "./cachedData/workItemTypes";
import { iterationStrings, areaStrings } from "./cachedData/nodes";
import { tags } from "./cachedData/tags";
import { getFieldComparisonLookup } from "./wiqlErrorCheckers/TypeErrorChecker";

function getSymbolSuggestionMap(refName: string, type: FieldType | null, fields: WorkItemField[]) {
    refName = refName.toLocaleLowerCase();
    /** These symbols have their own suggestion logic */
    const excludedSymbols = [Symbols.Variable, Symbols.Field];
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
function getVariableSuggestions(type: FieldType | null) {
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

const conditionSymbols = [
    Symbols.Equals,
    Symbols.NotEquals,
    Symbols.LessThan,
    Symbols.LessOrEq,
    Symbols.GreaterThan,
    Symbols.GreaterOrEq,
    Symbols.Like,
    Symbols.Under,
    Symbols.Contains,
    Symbols.Ever,
    Symbols.In
];
/**
 * Whether the given parseState is parsing a conditional token.
 * Ideally the compilier would be able to tell us which productions it was currently parsing - this is just a workaround.
 * @param symbol
 */
function isInConditionParse(parseNext: ParseError) {
    for (let symbol of parseNext.parsedTokens) {
        for (let conditionSym of conditionSymbols) {
            if (symbol instanceof conditionSym) {
                return true;
            }
        }
    }
    return false;
}
function getFieldSymbolRefName(parseNext: ParseError): string {
    for (let symbol of parseNext.parsedTokens) {
        if (symbol instanceof Symbols.Field) {
            return symbol.identifier.text.toLocaleLowerCase();
        }
    }
    return "";
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
            const fieldRefName = getFieldSymbolRefName(parseNext);
            const fieldInstance = getField(fieldRefName, fields) || null;
            const fieldType = fieldInstance && fieldInstance.type;
            const inCondition = isInConditionParse(parseNext);
            if (prevToken instanceof Symbols.Identifier
                && position.column - 1 === prevToken.endColumn) {
                // In process of typing field name
                // (parser just consumes this becuase it doesn't know which fields are valid)
                let suggestions: monaco.languages.CompletionItem[] = getFieldSuggestions(fields, inCondition ? fieldType : null);
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
                return getVariableSuggestions(inCondition ? fieldType : null).map(s => {return {
                    label: s.label,
                    kind: monaco.languages.CompletionItemKind.Variable,
                    insertText: s.label.replace("@", "")
                } as monaco.languages.CompletionItem; });
            } else {
                const suggestions: monaco.languages.CompletionItem[] = [];
                // Don't complete inside strings
                if (!(parseNext.errorToken instanceof Symbols.NonterminatingString)) {
                    // if right after identifier it will not have been reduced to a field yet.
                    const field = prevToken instanceof Symbols.Identifier ? getField(prevToken.text, fields) : null;
                    const refName = fieldRefName || (field ? field.referenceName : "");
                    const symbolSuggestionMap = getSymbolSuggestionMap(refName, inCondition ? fieldType : null, fields);
                    // Include keywords
                    for (let token of parseNext.expectedTokens) {
                        if (symbolSuggestionMap[token]) {
                            // TODO filter by value type symbols by type
                            suggestions.push(symbolSuggestionMap[token]);
                        }
                    }
                    // Include field and variables
                    if (parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Identifier)) >= 0) {
                        let fieldSuggestions = getFieldSuggestions(fields, inCondition ? fieldType : null);
                        if (!(prevToken instanceof Symbols.LSqBracket)) {
                            fieldSuggestions = fieldSuggestions.filter((s) => s.label.indexOf(" ") < 0);
                        }
                        suggestions.push(...fieldSuggestions);
                    }
                    if (parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Variable)) >= 0) {
                        suggestions.push(...getVariableSuggestions(inCondition ? fieldType : null));
                    }
                }
                // Field Values
                if (fieldRefName && inCondition) {
                    const expectingString = parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.String)) >= 0;
                    const inString = parseNext.errorToken instanceof Symbols.NonterminatingString;
                    const pushStringSuggestions = (strings: IPromise<string[]>) => {
                        return strings.then(strings => {
                            for (let str of strings) {
                                suggestions.push({
                                    label: inString ? str : `"${str}"`,
                                    kind: monaco.languages.CompletionItemKind.Text
                                } as monaco.languages.CompletionItem);
                            }
                            if (parseNext.errorToken instanceof Symbols.NonterminatingString) {
                                const currentStr = parseNext.errorToken.text.substr(1);
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
                    };
                    if (isIdentityField(fields, fieldRefName) && expectingString) {
                        return pushStringSuggestions(identities.getValue());
                    } else if (equalFields("System.State", fieldRefName, fields) && expectingString) {
                        return pushStringSuggestions(states.getValue());
                    } else if (equalFields("System.WorkItemType", fieldRefName, fields) && expectingString) {
                        return pushStringSuggestions(witNames.getValue());
                    } else if (equalFields("System.AreaPath", fieldRefName, fields) && expectingString) {
                        return pushStringSuggestions(areaStrings.getValue());
                    } else if (equalFields("System.IterationPath", fieldRefName, fields) && expectingString) {
                        return pushStringSuggestions(iterationStrings.getValue());
                    } else if (equalFields("System.Tags", fieldRefName, fields) && expectingString) {
                        return pushStringSuggestions(tags.getValue());
                    }
                }

                return suggestions;
            }
        }
    };
};
