import { fieldsVal } from "../../cachedData/fields";
import { IParseResults, parse, ParseError, ParseMode } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { createContext, ICompletionContext } from "./completionContext";
import { includeFields } from "./fieldCompletion";
import { getCurrentIdentifierSuggestions } from "./identifierCompletion";
import { includeKeywords } from "./keywordCompletion";
import { pushStringSuggestions } from "./pushStringSuggestions";
import { getStringValueSuggestions } from "./valueSuggestions";
import { getCurrentVariableSuggestions, includeVariables } from "./variableCompletion";

function parseFromPosition(model: monaco.editor.IReadOnlyModel, position: monaco.Position): IParseResults {
    const lines = model.getLinesContent().slice(0, position.lineNumber);
    if (lines.length > 0) {
        lines[lines.length - 1] = lines[lines.length - 1].substr(0, position.column - 1);
    }
    return parse(lines, ParseMode.Suggest);
}

function isInsideString(ctx: ICompletionContext) {
    return ctx.parseNext.errorToken instanceof Symbols.NonterminatingString;
}

async function provideCompletionItems(
    model: monaco.editor.IReadOnlyModel,
    position: monaco.Position,
    // token: monaco.CancellationToken,
): Promise<monaco.languages.CompletionItem[]> {
    const parseNext = parseFromPosition(model, position);
    if (!(parseNext instanceof ParseError) || parseNext.remainingTokens.length > 2) {
        // valid query, can't suggest
        return [];
    }
    const ctx = createContext(model, parseNext, await fieldsVal.getValue());
    const suggestions: monaco.languages.CompletionItem[] = await getCurrentIdentifierSuggestions(ctx, position) ||
        await getCurrentVariableSuggestions(ctx, position) || [];
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

export const completionProvider: monaco.languages.CompletionItemProvider = {
    triggerCharacters: [" ", "\t", "[", ".", "@", "\"", "'", "\\"],
    provideCompletionItems,
};
