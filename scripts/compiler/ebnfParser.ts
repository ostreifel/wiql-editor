import { TokenPattern, tokenize } from './tokenizer';
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
        return match[1].toUpperCase();
    }
    throw new Error('type is not a function');
}

const ebnfPatterns: TokenPattern[] = [
    // Ignore whitespace
    { match: /[ \r\t\n]/ },
    // Define tokens
    { match: /\w+/, token: Identity },
    { match: '=', token: Equals },
    { match: ',', token: Comma },
    { match: ';', token: Semicolon },
    { match: '|', token: VerticalBar },
    { match: '[', token: LSqBracket },
    { match: ']', token: RSqBracket },
    { match: '(', token: LParen },
    { match: ')', token: RParen },
    { // Comments
        match: '(*',
        pushState: [
            { match: '*)', popState: true },
            { match: '/./' },
        ]
    },
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
        throw new Error(`${message}, (${token.line}, ${token.column})`);
    } else {
        throw new Error(`${message}, EOF`);
    }
}
function peek(tokens: Token[], validTypes: Function | Function[], throwIfNot = true): Function {
    if (validTypes instanceof Function) {
        validTypes = [validTypes];
    }
    const token = tokens[0];
    let match: Function | null = null;
    for (let type of validTypes) {
        if (token instanceof type) {
            match = type;
        }
    }
    if (!match) {
        throwError(`Expected one of ${validTypes.map(t => getTokenName(t)).join(',')}`);
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
    next(tokens, LParen);
    const inputs = parseInputs(tokens);
    next(tokens, RParen);
    return new Optionals(inputs);
}

function parseInputs(tokens: Token[]): InputType[][] {
    const inputsArr: InputType[][] = [];
    while (true) {

        const inputs: InputType[] = [];
        const type = peek(tokens, [Identity, RParen, RSqBracket]);
        if (type === Identity) {
            inputs.push((tokens.shift() as Identity).text);
        } else if (type === LParen) {
            const grouping = parseGrouping(tokens);
            inputs.push(grouping);
        } else if (type === RSqBracket) {
            const optionals = parseOptionals(tokens);
            inputs.push(optionals);
        }
        const next = peek(tokens, [Comma, VerticalBar], false);
        if (next === Comma) {
            next(Comma);
        } else {
            inputsArr.push(inputs);
            if (next !== VerticalBar) {
                return inputsArr;
            }
            next(VerticalBar);
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

export function parse(fileName: string): IPromise<Rule[]> {
    const deferred = Q.defer<Rule[]>();
    const reader = new FileReader();
    reader.onload = file => {
        const tokens = tokenize(file.target['result'], ebnfPatterns);
        try {
            const rules = parseRules(tokens);
            deferred.resolve(rules);
        } catch (e) {
            deferred.reject(e);
        }
    }
    reader.onerror = e => deferred.reject(e);

    return deferred.promise;
}