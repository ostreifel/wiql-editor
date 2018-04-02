import { fieldsVal } from "../../cachedData/fields";
import { IParseResults, parse, ParseError, ParseMode } from "../compiler/parser";
import { createContext } from "./completionContext";
import { getCurrentIdentifierSuggestions } from "./identifierCompletion";
import { getSuggestions } from "./suggestions";
import { getCurrentVariableSuggestions } from "./variableCompletion";

function parseFromPosition(model: monaco.editor.IReadOnlyModel, position: monaco.Position): IParseResults {
    const lines = model.getLinesContent().slice(0, position.lineNumber);
    if (lines.length > 0) {
        lines[lines.length - 1] = lines[lines.length - 1].substr(0, position.column - 1);
    }
    return parse(lines, ParseMode.Suggest);
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
    return await getCurrentIdentifierSuggestions(ctx, position) ||
        await getCurrentVariableSuggestions(ctx, position) ||
        getSuggestions(ctx);
}

export const completionProvider: monaco.languages.CompletionItemProvider = {
    triggerCharacters: [" ", "\t", "[", ".", "@", "\"", "'", "\\"],
    provideCompletionItems,
};
