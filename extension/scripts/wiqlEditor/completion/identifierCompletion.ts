import * as Symbols from "../compiler/symbols";
import { ICompletionContext } from "./completionContext";
import { getStandardFieldCompletions } from "./fieldCompletion";

export async function getCurrentIdentifierCompletions(ctx: ICompletionContext, position: monaco.Position): Promise<monaco.languages.CompletionItem[]> {
    if (ctx.isFieldAllowed && ctx.prevToken instanceof Symbols.Identifier
        && position.column - 1 === ctx.prevToken.endColumn) {
        // In process of typing field name
        // (parser just consumes this becuase it doesn't know which fields are valid)
        let completions: monaco.languages.CompletionItem[] = getStandardFieldCompletions(ctx.fields, ctx.isInCondition ? ctx.fieldType : null);
        if (!(ctx.prevToken2 instanceof Symbols.LSqBracket)) {
            completions = completions.filter((s) => s.label.indexOf(" ") < 0);
        }
        const spaceIdx = ctx.prevToken.text.lastIndexOf(" ");
        const dotIdx = ctx.prevToken.text.lastIndexOf(".");
        const charIdx = Math.max(spaceIdx, dotIdx);
        if (charIdx >= 0) {
            const prefix = ctx.prevToken.text.substr(0, charIdx + 1).toLocaleLowerCase();
            completions = completions.filter((s) => s.label.toLocaleLowerCase().indexOf(prefix) === 0)
                .map((s) => {
                    return {
                        label: s.label,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: s.label.substr(charIdx + 1),
                    };
                });
        }
        return completions;
    }
    return [];
}
