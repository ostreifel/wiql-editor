import * as Symbols from "./symbols";
import { tokenize } from "./tokenizer";
import { wiqlPatterns } from "./tokenPatterns";

import { table } from "./wiqlTable";


const symbolContructors: { [name: string]: any } = {};
for (let idx in Symbols) {
    const symbol = Symbols[idx];
    const symbolName = Symbols.getSymbolName(symbol);
    symbolContructors[symbolName] = symbol;
}

export class ParseError {
    constructor(
        readonly expectedTokens: string[],
        readonly errorToken: Symbols.Token,
        readonly remainingTokens: Symbols.Token[],
        readonly parsedTokens: Symbols.Symbol[]
    ) { }
}
export type IParseResults = Symbols.Symbol | ParseError;

export enum ParseMode {
    Default,
    Suggest,
    AssumeString
}

const EOF = Symbols.getSymbolName(Symbols.EOF);
export function parse(lines: string[], mode = ParseMode.Default): IParseResults {
    const tokens = tokenize(lines, wiqlPatterns).reverse();
    tokens.unshift(new Symbols.EOF(lines.length, lines[lines.length - 1].length, tokens[0]));

    type stackState = { state: number, symbol: Symbols.Symbol };
    const stack: stackState[] = [];
    const peekToken = () => tokens[tokens.length - 1];
    const currState = () => stack.length ? stack[stack.length - 1].state : 0;
    const symbolName = (symbol: Symbols.Symbol) => Symbols.getSymbolName(Object.getPrototypeOf(symbol).constructor);
    while (true) {
        const state = currState();
        let nextToken = peekToken();
        let nextTokenName = symbolName(nextToken);
        if (
            mode === ParseMode.AssumeString &&
            !(nextTokenName in table[state].tokens) &&
            Symbols.getSymbolName(Symbols.String) in table[state].tokens
        ) {
            tokens.push(new Symbols.String(-1, -1, ""));
            nextToken = peekToken();
            nextTokenName = symbolName(nextToken);
        }


        const action = table[state].tokens[nextTokenName];
        if (action === undefined || (mode === ParseMode.Suggest && nextTokenName === EOF)) {
            const expectedTokens = Object.keys(table[state].tokens);
            return new ParseError(
                expectedTokens,
                nextToken,
                tokens,
                stack.map((i) => i.symbol)
            );
        }
        if (action.action === "shift") {
            stack.push({ state: action.state, symbol: <Symbols.Token>tokens.pop() });
        } else if (action.action === "reduce") {
            const args: Symbols.Symbol[] = [];
            for (let i = 0; i < action.production.inputCount; i++) {
                args.push((<stackState>stack.pop()).symbol);
            }
            args.reverse();
            const sym: Symbols.Symbol = new symbolContructors[action.production.result](args);
            const symName = symbolName(sym);
            const nextState = table[currState()].symbols[symName];
            if (nextState === undefined) {
                throw new Error(`Grammar error: unexpected symbol ${symName}`);
            } else if (nextState === -1) {
                return sym;
            } else {
                stack.push({ state: nextState, symbol: sym });
            }
        }
    }
}
