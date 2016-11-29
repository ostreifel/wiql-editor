import {states, transitions, resolutions} from './wiqlDfa';
import * as Symbols from './wiqlSymbols';
import {IProduction} from './wiqlProductions';
import {tokenize} from './wiqlTokenizer';

enum Action  {
    Shift,
    Reduce,
    Goto,
}
function computeTable() {
    const table: {
        tokens: {
            [symbolName: string]: 
            {action: Action.Shift, state: number} |
            {action: Action.Reduce, production: IProduction} |
            undefined
        }
        symbols: {
            [symbolName: string]: number | undefined
        }
    }[] = [];
    for (let i = 0; i < states.length; i++) {
        table[i] = {tokens:{}, symbols: {}};
    }
    for (let transition of transitions) {
        const symbolName = Symbols.getSymbolName(transition.symbolClass);
        if (Symbols.isTokenClass(transition.symbolClass)) {
            table[transition.from].tokens[symbolName] = {action: Action.Shift, state: transition.to};
        } else {
            table[transition.from].symbols[symbolName] = transition.to;
        }
    }
    for (let resolution of resolutions) {
        const symbolName = Symbols.getSymbolName(resolution.symbolClass);
        table[resolution.stateIdx].tokens[symbolName] = {action: Action.Reduce, production: resolution.production};
    }
    for (let acceptSymbol of [Symbols.FlatSelect]) {
        table[0].symbols[Symbols.getSymbolName(acceptSymbol)] = -1;
    }
    return table;
}

const table = computeTable();

export class ParseError {
    constructor(readonly expectedTokens: string[],
        readonly errorToken: Symbols.Token,
        readonly remainingTokens: number) {
    }
}
export type IParseResults = Symbols.Symbol | ParseError

const EOF = Symbols.getSymbolName(Symbols.EOF);
export function parse(lines: string[], forceSuggest = false): IParseResults {
    const tokens = tokenize(lines).reverse();
    type stackState = {state: number, symbol: Symbols.Symbol};
    const stack: stackState[] = [];
    const peekToken = () => tokens[tokens.length - 1];
    const currState = () => stack.length ? stack[stack.length - 1].state : 0;
    const symbolName = (symbol: Symbols.Symbol) => Symbols.getSymbolName(Object.getPrototypeOf(symbol).constructor);
    while (true) {
        const state = currState();
        const nextToken = peekToken();
        const nextTokenName = symbolName(nextToken);
        const action = table[state].tokens[nextTokenName];
        if (action === undefined || (forceSuggest && nextTokenName === EOF)) {
            const expectedTokens = Object.keys(table[state].tokens);
            return new ParseError(
                expectedTokens,
                nextToken,
                tokens.length,

            );
        }
        if (action.action === Action.Shift) {
            stack.push({state: action.state, symbol: <Symbols.Token>tokens.pop()});
        } else if (action.action === Action.Reduce) {
            const args: Symbols.Symbol[] = [];
            for (let input of action.production.inputs) {
                args.push((<stackState>stack.pop()).symbol);
            }
            args.reverse();
            const sym = action.production.fromInputs(args);
            const symName = symbolName(sym);
            const nextState = table[currState()].symbols[symName];
            if (nextState === undefined) {
                throw new Error(`Grammar error: unexpected symbol ${symName}`);
            } else if (nextState === -1) {
                return sym;
            } else {
                stack.push({state: nextState, symbol: sym});
            }
        }
    }
}