import * as Symbols from "../compiler/wiqlSymbols";
import { IParseResults, ParseError } from "../compiler/wiqlParser";

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
/**
 * Recurse through each symbol as a tree and return the ones of type
 * @param type returned symbols should be an instanceof
 */
export function symbolsOfType<T extends Symbols.Symbol>(parseResult: IParseResults, type: Function): T[] {
    const stack: Symbols.Symbol[] = [];
    if (parseResult instanceof ParseError) {
        stack.push(...parseResult.parsedTokens);
    } else {
        stack.push(parseResult);
    }
    const matchingSymbols: T[] = [];
    while (stack.length) {
        const symbol = <Symbols.Symbol>stack.pop();
        if (symbol instanceof type) {
            matchingSymbols.push(symbol as T);
        }
        if (symbol instanceof Symbols.SymbolTree) {
            stack.push(...symbol.inputs);
        }
    }
    return matchingSymbols;
}
