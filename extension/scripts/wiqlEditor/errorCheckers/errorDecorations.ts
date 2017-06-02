import * as Symbols from "../compiler/symbols";
import { IParseResults, ParseError } from "../compiler/parser";

export function toPosition(symbol: Symbols.Symbol | Symbols.Symbol[]) {
    let startToken: Symbols.Token | null = null;
    let endToken: Symbols.Token | null = null;
    const symbols = [symbol];
    while (symbols.length > 0) {
        const sym = symbols.pop();
        if (sym instanceof Symbols.Token) {
            if (!startToken || sym.line < startToken.line || sym.startColumn < startToken.startColumn) {
                startToken = sym;
            }
            if (!endToken || sym.line > endToken.line || sym.endColumn > endToken.endColumn) {
                endToken = sym;
            }
        } else if (symbol instanceof Symbols.SymbolTree) {
            symbols.push(...symbol.inputs);
        }
    }
    if (!startToken || !endToken) {
        throw new Error("Could not find token in symbol");
    }
    return new monaco.Range(
        startToken.line + 1,
        startToken.startColumn + 1,
        endToken.line + 1,
        endToken.endColumn + 1,
    );
}
export function toDecoration(symbol: Symbols.Symbol | Symbols.Symbol[], message: string) {
    return {
        range: toPosition(symbol),
        options: {
            hoverMessage: message,
            className: "wiql-error",
            linesDecorationsClassName: "wiql-error-margin",
        }
    };
}
