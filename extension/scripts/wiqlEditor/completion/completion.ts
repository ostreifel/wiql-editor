import { fieldsVal } from "../../cachedData/fields";
import { IParseResults, parse, ParseError, ParseMode } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { createContext, ICompletionContext } from "./completionContext";
import { getFieldCompletions } from "./fieldCompletion";
import { getCurrentIdentifierCompletions } from "./identifierCompletion";
import { getKeywordCompletions } from "./keywordCompletion";
import { pushStringCompletions } from "./pushStringCompletions";
import { getStringValueCompletions } from "./valueCompletions";
import { getCurrentVariableCompletions, getVariableCompletions } from "./variableCompletion";

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
    const completions: monaco.languages.CompletionItem[] = [
        ...await getCurrentIdentifierCompletions(ctx, position),
        ...await getCurrentVariableCompletions(ctx, position),
    ];
    // Don't symbols complete inside strings
    if (!isInsideString(ctx)) {
        completions.push(
            ...getKeywordCompletions(ctx),
            ...getFieldCompletions(ctx),
            ...getVariableCompletions(ctx),
        );
    }
    // Field Values
    if (ctx.fieldRefName && ctx.isInCondition) {
        const values = getStringValueCompletions(ctx);
        return pushStringCompletions(ctx, values, completions);
    }

    return completions;
}

export const completionProvider: monaco.languages.CompletionItemProvider = {
    triggerCharacters: [" ", "\t", "[", ".", "@", "\"", "'", "\\"],
    provideCompletionItems,
};
