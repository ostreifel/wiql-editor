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

