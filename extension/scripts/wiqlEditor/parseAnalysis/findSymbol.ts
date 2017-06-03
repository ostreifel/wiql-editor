import * as Symbols from "../compiler/symbols";
import { IParseResults, ParseError } from "../compiler/parser";

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

export function symbolsAtPosition(line: number, column: number, parseResult: IParseResults): Symbols.Symbol[] {
    if (parseResult instanceof ParseError) {
        for (const symbol of parseResult.parsedTokens) {
            const match = symbolsAtPositionImpl(line, column, symbol);
            if (match.length > 0) {
                return match;
            }
        }
    } else if (parseResult instanceof Symbols.SymbolTree) {
        return symbolsAtPositionImpl(line, column, parseResult);
    }
    return [];
}

function symbolsAtPositionImpl(line: number, column: number, symbol: Symbols.Symbol): Symbols.Symbol[] {
    if (symbol instanceof Symbols.Token) {
        const isMatch = symbol.line === line - 1 &&
            symbol.startColumn <= column &&
            symbol.endColumn >= column;
        if (isMatch) {
            return [symbol];
        }
    } else if (symbol instanceof Symbols.SymbolTree) {
        for (const input of symbol.inputs) {
            const match = symbolsAtPositionImpl(line, column, input);
            if (match.length > 0) {
                return [...match, symbol];
            }
        }
    }
    return [];
}
