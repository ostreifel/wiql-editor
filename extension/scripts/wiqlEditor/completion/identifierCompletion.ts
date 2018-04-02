import * as Symbols from "../compiler/symbols";
import { ICompletionContext } from "./completionContext";
import { getStandardFieldSuggestions } from "./fieldCompletion";

export async function getCurrentIdentifierSuggestions(ctx: ICompletionContext, position: monaco.Position): Promise<monaco.languages.CompletionItem[] | null> {
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
