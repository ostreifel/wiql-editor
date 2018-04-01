import { fieldsVal } from "../../cachedData/fields";
import { IParseResults, parse, ParseError, ParseMode } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { getStandardFieldSuggestions, getStandardVariableSuggestions } from "./commonCompletions";
import { createContext, ICompletionContext } from "./completionContext";
import { getSuggestions } from "./suggestions";

function parseFromPosition(model: monaco.editor.IReadOnlyModel, position: monaco.Position): IParseResults {
    const lines = model.getLinesContent().slice(0, position.lineNumber);
    if (lines.length > 0) {
        lines[lines.length - 1] = lines[lines.length - 1].substr(0, position.column - 1);
    }
    return parse(lines, ParseMode.Suggest);
}

async function getCurrentIdentifierSuggestions(ctx: ICompletionContext, position: monaco.Position): Promise<monaco.languages.CompletionItem[] | null> {
    if (ctx.isFieldAllowed && ctx.prevToken instanceof Symbols.Identifier
        && position.column - 1 === ctx.prevToken.endColumn) {
        // In process of typing field name
        // (parser just consumes this becuase it doesn't know which fields are valid)
        let suggestions: monaco.languages.CompletionItem[] = getStandardFieldSuggestions(ctx.fields, ctx.isInCondition ? ctx.fieldType : null);
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
                        insertText: s.label.substr(charIdx + 1),
                    };
                });
        }
        return suggestions;
    }
    return null;
}

async function getCurrentVariableSuggestions(ctx: ICompletionContext, position: monaco.Position): Promise<monaco.languages.CompletionItem[] | null> {
    if (ctx.prevToken instanceof Symbols.Variable
        && position.column - 1 === ctx.prevToken.endColumn) {
        return getStandardVariableSuggestions(ctx.isInCondition ? ctx.fieldType : null).map((s) => {
            return {
                label: s.label,
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: s.label.replace("@", ""),
            } as monaco.languages.CompletionItem;
        });
    }
    return null;
}

async function provideCompletionItems(
    model: monaco.editor.IReadOnlyModel,
    position: monaco.Position,
    token: monaco.CancellationToken,
): Promise<monaco.languages.CompletionItem[]> {
    const parseNext = parseFromPosition(model, position);
    if (!(parseNext instanceof ParseError) || parseNext.remainingTokens.length > 2) {
        // valid query, can't suggest
        return [];
    }
    const ctx = createContext(model, parseNext, await fieldsVal.getValue());
    return await getCurrentIdentifierSuggestions(ctx, position) ||
        await getCurrentVariableSuggestions(ctx, position) ||
        getSuggestions(ctx, position);
}

export const completionProvider: monaco.languages.CompletionItemProvider = {
    triggerCharacters: [" ", "\t", "[", ".", "@", "\"", "'"],
    provideCompletionItems,
};
