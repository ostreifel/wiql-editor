import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import { wiqlPatterns } from "./compiler/wiqlTokenPatterns";
import * as Symbols from "./compiler/wiqlSymbols";
import { parse, ParseError } from "./compiler/wiqlParser";
import { definedVariables } from "./wiqlDefinition";
import { isIdentityField, getIdentities} from "./identities";

function getSymbolSuggestionMap() {
    const symbolSuggestionMap: { [symbolName: string]: monaco.languages.CompletionItem } = {};
    for (let pattern of wiqlPatterns) {
        if (typeof pattern.match === "string") {
            const symName = Symbols.getSymbolName(pattern.token);
            symbolSuggestionMap[symName] = {
                label: pattern.match,
                kind: monaco.languages.CompletionItemKind.Keyword
            };
        }
    }
    return symbolSuggestionMap;
}
export const getCompletionProvider: (fields: WorkItemField[]) => monaco.languages.CompletionItemProvider = (fields) => {
    const fieldLabels = fields
        .map((f) => f.name)
        .concat(fields.map((f) => f.referenceName));
    const fieldSuggestions = fields.map((field) => {
        return <monaco.languages.CompletionItem>{
            label: field.name,
            kind: monaco.languages.CompletionItemKind.Variable
        };
    }).concat(fields.map((field) => {
        return <monaco.languages.CompletionItem>{
            label: field.referenceName,
            kind: monaco.languages.CompletionItemKind.Variable
        };
    }));
    const variableSuggestions = Object.keys(definedVariables).map((v) => {
        return {
            label: v,
            kind: monaco.languages.CompletionItemKind.Variable
        };
    });
    const symbolSuggestionMap = getSymbolSuggestionMap();
    return {
        triggerCharacters: [" ", "[", ".", "@"],
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
            if (prevToken instanceof Symbols.Identifier
                && position.column - 1 === prevToken.endColumn) {
                // In process of typing field name
                // (parser just consumes this becuase it doesn't know which fields are valid)
                const beforeIdent = parseNext.parsedTokens[parsedCount - 2];
                let suggestions: monaco.languages.CompletionItem[];
                if (beforeIdent instanceof Symbols.LSqBracket) {
                    suggestions = fieldSuggestions;
                } else {
                    suggestions = fieldSuggestions.filter((s) => s.label.indexOf(" ") < 0);
                }
                const spaceIdx = prevToken.text.lastIndexOf(" ");
                const dotIdx = prevToken.text.lastIndexOf(".");
                const charIdx = Math.max(spaceIdx, dotIdx);
                if (charIdx >= 0) {
                    const prefix = prevToken.text.substr(0, charIdx + 1);
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
                return Object.keys(definedVariables).map((v) => {
                    return {
                        label: v,
                        kind: monaco.languages.CompletionItemKind.Value,
                        insertText: v.replace("@", "")
                    };
                });
            } else {
                const suggestions: monaco.languages.CompletionItem[] = [];
                // Don't complete inside strings
                if (!(parseNext.errorToken instanceof Symbols.NonterminatingString)) {
                    // Include keywords
                    for (let token of parseNext.expectedTokens) {
                        if (symbolSuggestionMap[token]) {
                            suggestions.push(symbolSuggestionMap[token]);
                        }
                    }
                    // Include field and variables
                    if (parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Identifier)) >= 0) {
                        suggestions.push(...fieldSuggestions.filter((s) => s.label.indexOf(" ") < 0));
                    }
                    if (parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Variable)) >= 0) {
                        suggestions.push(...variableSuggestions);
                    }
                }
                // Identities
                const prev2 = parseNext.parsedTokens[parsedCount - 2];
                const prev3 = parseNext.parsedTokens[parsedCount - 3];
                const field = prev2 instanceof Symbols.Field ? prev2 : prev3;
                if (field instanceof Symbols.Field &&
                    isIdentityField(fields, field.identifier.text) &&
                    parseNext.expectedTokens.indexOf("String") >= 0) {
                    const inString = parseNext.errorToken instanceof Symbols.NonterminatingString;
                    return getIdentities().then(identities => {
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
