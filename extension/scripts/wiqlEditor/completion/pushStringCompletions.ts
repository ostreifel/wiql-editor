import * as Symbols from "../compiler/symbols";
import { ICompletionContext } from "./completionContext";

function isInsideString(ctx: ICompletionContext) {
    return ctx.parseNext.errorToken instanceof Symbols.NonterminatingString;
}

export async function pushStringCompletions(
    ctx: ICompletionContext,
    stringsPromise: PromiseLike<string[]>,
    completions: monaco.languages.CompletionItem[],
): Promise<monaco.languages.CompletionItem[]> {
    const inString = isInsideString(ctx);
    const strings = await stringsPromise;
    for (const str of strings) {
        completions.push({
            label: inString ? str : `"${str}"`,
            kind: monaco.languages.CompletionItemKind.Text,
        } as monaco.languages.CompletionItem);
    }
    if (ctx.parseNext.errorToken instanceof Symbols.NonterminatingString) {
        const currentStr = ctx.parseNext.errorToken.text.substr(1);
        let charIdx = -1;
        for (const char of ". \\-:<>") {
            charIdx = Math.max(charIdx, currentStr.lastIndexOf(char));
        }
        if (charIdx >= 0) {
            const prefix = currentStr.substr(0, charIdx).toLocaleLowerCase();
            return completions.filter((s) => s.label.toLocaleLowerCase().indexOf(prefix) === 0).map((s) =>
                ({
                    label: s.label,
                    kind: monaco.languages.CompletionItemKind.Text,
                    insertText: s.label.substr(charIdx + 1),
                } as monaco.languages.CompletionItem),
            );
        }
    }
    return completions;
}
