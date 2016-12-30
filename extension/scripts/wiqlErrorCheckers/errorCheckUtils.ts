import * as Symbols from "../compiler/wiqlSymbols";
import { IParseResults, ParseError } from "../compiler/wiqlParser";

export function toPosition(symbol: Symbols.Symbol | Symbols.Symbol[]) {
    let startToken: Symbols.Token | null = null;
    let endToken: Symbols.Token | null = null;
    if (symbol instanceof Symbols.Token) {
        startToken = endToken = symbol;
    } else {
        const symbols = [symbol];
        do {
            const sym = <Symbols.Symbol>symbols.pop();
            for (let key in sym) {
                const prop = sym[key];
                if (prop instanceof Symbols.Token) {
                    if (!startToken || prop.line < startToken.line || prop.startColumn < startToken.startColumn) {
                        startToken = prop;
                    }
                    if (!endToken || prop.line > endToken.line || prop.endColumn > endToken.endColumn) {
                        endToken = prop;
                    }
                } else if (prop instanceof Symbols.Symbol) {
                    symbols.push(prop);
                }
            }
        } while (symbols.length > 0);
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
