import * as Symbols from '../wiqlSymbols';
import { IParseResults, ParseError } from '../wiqlParser';

export function toPosition(token: Symbols.Token) {
    return new monaco.Range(
        token.line + 1,
        token.startColumn + 1,
        token.line + 1,
        token.endColumn + 1,
    );
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
        for (let key in symbol) {
            const prop = symbol[key];
            if (prop instanceof type) {
                matchingSymbols.push(prop);
            }
            if (prop instanceof Symbols.Symbol) {
                stack.push(prop);
            }
        }
    }
    return matchingSymbols;
}
