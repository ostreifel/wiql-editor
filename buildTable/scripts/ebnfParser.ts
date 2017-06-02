// borrow the tokenizer from wiql
import { TokenPattern, tokenize } from './tokenizer';
import * as fs from 'fs';
import * as Q from 'q';

abstract class Token {
    constructor(readonly line: number, readonly column: number, readonly text: string) { }
}
class Identity extends Token { }
class Equals extends Token { }
class Comma extends Token { }
class Semicolon extends Token { }
class VerticalBar extends Token { }
class LSqBracket extends Token { }
class RSqBracket extends Token { }
class LParen extends Token { }
class RParen extends Token { }
class Unexpected extends Token { }

export function getTokenName(symbolClass: Function): string {
    const str: string = symbolClass.toString();
    const match = str.match(/function (\S+)(?=\()/);
    if (match) {
        return match[1];
    }
    throw new Error('type is not a function');
}

const ebnfPatterns: TokenPattern[] = [
    // Ignore whitespace
    { match: /[ \r\t\n]/ },
    // Define tokens
    { match: /\w+/, token: Identity },
    { match: '=', token: Equals },
    { match: ';', token: Semicolon },
    { match: '|', token: VerticalBar },
    { match: '[', token: LSqBracket },
    { match: ']', token: RSqBracket },
    { // Comments
        match: '(*',
        pushState: [
            { match: '*)', popState: true },
            { match: /.|\s/ },
        ]
    },
    { match: '(', token: LParen },
    { match: ')', token: RParen },
    // Define error tokens
    { match: /./, token: Unexpected },
];


export type InputType = Optionals | string | Grouping;
export class Optionals {
    constructor(readonly inputs: InputType[][]) { }
}
export class Grouping {
    constructor(readonly inputs: InputType[][]) { }
}
export class Rule {
    constructor(readonly result: string, readonly inputs: InputType[][]) { }
}
function throwError(message: string, token?: Token): never {
    if (token) {
        throw new Error(`${message}: (${token.line}, ${token.column})`);
    } else {
        throw new Error(`${message}: EOF`);
    }
}
function peek(tokens: Token[], validTypes: Function | Function[], throwIfNot = true): Function {
    if (validTypes instanceof Function) {
        validTypes = [validTypes];
    }
    const token = tokens[0];
    let match: Function | null = null;
    for (const type of validTypes) {
        if (token instanceof type) {
            match = type;
        }
    }
    if (!match && throwIfNot) {
        throwError(`Expected one of ${validTypes.map(t => getTokenName(t)).join(',')}`, token);
    }
    return match as Function;
}
function next(tokens: Token[], validTypes: Function | Function[]): Token {
    peek(tokens, validTypes);
    return tokens.shift() as Token;
}

function parseGrouping(tokens: Token[]): Grouping {
    next(tokens, LParen);
    const inputs = parseInputs(tokens);
    next(tokens, RParen);
    return new Grouping(inputs);
}

function parseOptionals(tokens: Token[]): Optionals {
    next(tokens, LSqBracket);
    const inputs = parseInputs(tokens);
    next(tokens, RSqBracket);
    return new Optionals(inputs);
}

function parseInputs(tokens: Token[]): InputType[][] {
    const inputsArr: InputType[][] = [];
    let inputs: InputType[] = [];
    while (true) {
        const type = peek(tokens, [Identity, LParen, LSqBracket]);
        if (type === Identity) {
            inputs.push((tokens.shift() as Identity).text);
        } else if (type === LParen) {
            const grouping = parseGrouping(tokens);
            inputs.push(grouping);
        } else if (type === LSqBracket) {
            const optionals = parseOptionals(tokens);
            inputs.push(optionals);
        }
        if (!peek(tokens, [Identity, LParen, LSqBracket], false)) {
            inputsArr.push(inputs);
            inputs = [];
            if (!peek(tokens, VerticalBar, false)) {
                return inputsArr;
            }
            next(tokens, VerticalBar);
        }
    }
}

function parseRules(tokens: Token[]) {
    const rules: Rule[] = [];
    while (tokens.length > 0) {
        const ident: Identity = next(tokens, Identity);
        next(tokens, Equals);
        const inputs: InputType[][] = parseInputs(tokens);
        next(tokens, Semicolon);
        rules.push(new Rule(ident.text, inputs));
    }
    return rules;
}

export function parse(fileName: string): Rule[] {
    const fileContents = fs.readFileSync(fileName, { encoding: 'utf-8' }).split('\r\n');
    const tokens = tokenize(fileContents, ebnfPatterns);
    return parseRules(tokens);
}
