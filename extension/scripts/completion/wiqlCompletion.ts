import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";
import { wiqlPatterns } from "../compiler/wiqlTokenPatterns";
import * as Symbols from "../compiler/wiqlSymbols";
import { parse, IParseResults, ParseError } from "../compiler/wiqlParser";
import { isIdentityField, identities } from "../cachedData/identities";
import { equalFields, getField } from "../cachedData/fields";
import { states, witNames } from "../cachedData/workItemTypes";
import { iterationStrings, areaStrings } from "../cachedData/nodes";
import { tags } from "../cachedData/tags";
import { getFieldComparisonLookup } from "../wiqlErrorCheckers/TypeErrorChecker";
import { projects } from "../cachedData/projects";
import { fields } from "../cachedData/fields";
import { createContext, ICompletionContext, conditionSymbols } from "./completionContext";
import { getFieldSuggestions, getVariableSuggestions } from "./commonCompletions";

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

function parseFromPosition(model: monaco.editor.IReadOnlyModel, position: monaco.Position): IParseResults {
    const lines = model.getLinesContent().slice(0, position.lineNumber);
    if (lines.length > 0) {
        lines[lines.length - 1] = lines[lines.length - 1].substr(0, position.column - 1);
    }
    return parse(lines, true);
}

function provideCompletionItems(
    model: monaco.editor.IReadOnlyModel,
    position: monaco.Position,
    token: monaco.CancellationToken
): Q.IPromise<monaco.languages.CompletionItem[]> {
    return fields.getValue().then(fields => {
        const parseNext = parseFromPosition(model, position);
        console.log(parseNext);
        if (!(parseNext instanceof ParseError) || parseNext.remainingTokens.length > 2) {
            // valid query, can't suggest
            return [];
        }
        const ctx = createContext(parseNext, fields);
        if (ctx.isFieldAllowed && ctx.prevToken instanceof Symbols.Identifier
            && position.column - 1 === ctx.prevToken.endColumn) {
            // In process of typing field name
            // (parser just consumes this becuase it doesn't know which fields are valid)
            let suggestions: monaco.languages.CompletionItem[] = getFieldSuggestions(fields, ctx.isInCondition ? ctx.fieldType : null);
            if (!(ctx.prevToken2 instanceof Symbols.LSqBracket)) {
                suggestions = suggestions.filter((s) => s.label.indexOf(" ") < 0);
            }
            const spaceIdx = ctx.prevToken.text.lastIndexOf(" ");
            const dotIdx = ctx.prevToken.text.lastIndexOf(".");
            const charIdx = Math.max(spaceIdx, dotIdx);
            if (charIdx >= 0) {
                const prefix = ctx.prevToken.text.substr(0, charIdx + 1).toLocaleLowerCase();
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
        } else if (ctx.prevToken instanceof Symbols.Variable
            && position.column - 1 === ctx.prevToken.endColumn) {
            return getVariableSuggestions(ctx.isInCondition ? ctx.fieldType : null).map(s => {
                return {
                    label: s.label,
                    kind: monaco.languages.CompletionItemKind.Variable,
                    insertText: s.label.replace("@", "")
                } as monaco.languages.CompletionItem;
            });
        } else {
            const suggestions: monaco.languages.CompletionItem[] = [];
            // Don't complete inside strings
            if (!(parseNext.errorToken instanceof Symbols.NonterminatingString)) {
                // if right after identifier it will not have been reduced to a field yet.
                const field = ctx.prevToken instanceof Symbols.Identifier ? getField(ctx.prevToken.text, fields) : null;
                const refName = ctx.fieldRefName || (field ? field.referenceName : "");
                const symbolSuggestionMap = getSymbolSuggestionMap(refName, ctx.isInCondition ? ctx.fieldType : null, fields, ctx.isFieldAllowed);
                // Include keywords
                for (let token of parseNext.expectedTokens) {
                    if (symbolSuggestionMap[token]) {
                        // TODO filter by value type symbols by type
                        suggestions.push(symbolSuggestionMap[token]);
                    }
                }
                // Include field and variables
                if (parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Identifier)) >= 0 && ctx.isFieldAllowed) {
                    let fieldSuggestions = getFieldSuggestions(fields, ctx.isInCondition ? ctx.fieldType : null);
                    if (!(ctx.prevToken instanceof Symbols.LSqBracket)) {
                        fieldSuggestions = fieldSuggestions.filter((s) => s.label.indexOf(" ") < 0);
                    }
                    suggestions.push(...fieldSuggestions);
                }
                if (parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Variable)) >= 0) {
                    suggestions.push(...getVariableSuggestions(ctx.isInCondition ? ctx.fieldType : null));
                }
            }
            // Field Values
            if (ctx.fieldRefName && ctx.isInCondition) {
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
                if (isIdentityField(fields, ctx.fieldRefName) && expectingString) {
                    return pushStringSuggestions(identities.getValue());
                } else if (equalFields("System.TeamProject", ctx.fieldRefName, fields) && expectingString) {
                    return pushStringSuggestions(projects.getValue().then(projs => projs.map(p => p.name)));
                } else if (equalFields("System.State", ctx.fieldRefName, fields) && expectingString) {
                    return pushStringSuggestions(states.getValue());
                } else if (equalFields("System.WorkItemType", ctx.fieldRefName, fields) && expectingString) {
                    return pushStringSuggestions(witNames.getValue());
                } else if (equalFields("System.AreaPath", ctx.fieldRefName, fields) && expectingString) {
                    return pushStringSuggestions(areaStrings.getValue());
                } else if (equalFields("System.IterationPath", ctx.fieldRefName, fields) && expectingString) {
                    return pushStringSuggestions(iterationStrings.getValue());
                } else if (equalFields("System.Tags", ctx.fieldRefName, fields) && expectingString) {
                    return pushStringSuggestions(tags.getValue());
                }
            }

            return suggestions;
        }
    });
}

export const completionProvider: monaco.languages.CompletionItemProvider = {
    triggerCharacters: [" ", "[", ".", "@", "\"", "'"],
    provideCompletionItems
};

