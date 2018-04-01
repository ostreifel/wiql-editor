import * as Symbols from "../compiler/symbols";

export function rangeFromSymbol(symbol: Symbols.Symbol | Symbols.Symbol[]) {
    let startToken: Symbols.Token | null = null;
    let endToken: Symbols.Token | null = null;
    const symbols = symbol instanceof Array ? symbol : [symbol];
    while (symbols.length > 0) {
        const sym = symbols.pop();
        if (sym instanceof Symbols.Token) {
            if (!startToken || sym.line < startToken.line || sym.startColumn < startToken.startColumn) {
                startToken = sym;
            }
            if (!endToken || sym.line > endToken.line || sym.endColumn > endToken.endColumn) {
                endToken = sym;
            }
        } else if (sym instanceof Symbols.SymbolTree) {
            symbols.push(...sym.inputs);
        }
    }
    if (!startToken || !endToken) {
        throw new Error("Could not find token in symbol " + JSON.stringify(symbol));
    }
    return new monaco.Range(
        startToken.line + 1,
        startToken.startColumn + 1,
        endToken.line + 1,
        endToken.endColumn + 1,
    );
}

export interface IWiqlDecoration extends monaco.editor.IModelDeltaDecoration {
    range: monaco.Range;
}

function decorationFromRange(
    hoverMessage: string,
    range: monaco.Range,
    type: "error" | "warn",
): IWiqlDecoration {
    return {
        range,
        options: {
            hoverMessage,
            className: `underline wiql-${type}`,
            linesDecorationsClassName: `column-color wiql-${type}`,
        },
    };
}

export function decorationFromString(
    message: string,
    str: Symbols.String,
    offset: number,
    length: number,
    type: "error" | "warn" = "error",
): IWiqlDecoration {
    return decorationFromRange(
        message,
        new monaco.Range(
            str.line + 1,
            str.startColumn + 1 + offset,
            str.line + 1,
            str.startColumn + 1 + offset + length,
        ),
        type,
    );
}

export function decorationFromSym(
    message: string,
    symbol: Symbols.Symbol | Symbols.Symbol[],
    type: "error" | "warn" = "error",
): IWiqlDecoration {
    return decorationFromRange(message, rangeFromSymbol(symbol), type);
}
