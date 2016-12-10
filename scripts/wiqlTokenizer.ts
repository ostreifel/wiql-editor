import * as Symbols from './wiqlSymbols';

interface TokenPattern {
    match: string | RegExp;
    token?;
    pushState?: TokenPattern[];
    popState?: boolean;
}
export const tokenPatterns: TokenPattern[] = [
    { match: /[ \r\t\n]+/ },
    { match: 'SELECT', token: Symbols.Select },
    { match: 'FROM', token: Symbols.From },
    { match: 'WHERE', token: Symbols.Where },
    { match: 'ORDER BY', token: Symbols.OrderBy },
    { match: 'ASC', token: Symbols.Asc },
    { match: 'DESC', token: Symbols.Desc },
    { match: 'ASOF', token: Symbols.Asof },
    { match: 'NOT', token: Symbols.Not },
    { match: 'EVER', token: Symbols.Not },
    { match: 'IN', token: Symbols.In },
    { match: 'LIKE', token: Symbols.Like },
    { match: 'UNDER', token: Symbols.Under },
    { match: 'workitems', token: Symbols.WorkItems },
    { match: 'workitemlinks', token: Symbols.WorkItemLinks },
    { match: 'AND', token: Symbols.And },
    { match: 'OR', token: Symbols.Or },
    { match: 'CONTAINS', token: Symbols.Contains },
    { match: 'WORDS', token: Symbols.Words },
    { match: 'GROUP', token: Symbols.Group },
    { match: 'true', token: Symbols.True },
    { match: 'false', token: Symbols.False },
    { match: '(', token: Symbols.LParen },
    { match: ')', token: Symbols.RParen },
    { match: '[any]', token: Symbols.Variable },
    { match: /@\w+/, token: Symbols.Variable },
    {
        match: '[',
        token: Symbols.LSqBracket,
        pushState: [
            { match: /[^\]]+/, token: Symbols.Identifier },
            { match: /]/, token: Symbols.RSqBracket, popState: true }
        ]
    },
    { match: /[a-z_][\w\.]*/, token: Symbols.Identifier },
    { match: ']', token: Symbols.RSqBracket },
    { match: ',', token: Symbols.Comma },
    { match: '=', token: Symbols.Equals },
    { match: '<>', token: Symbols.NotEquals },
    { match: '>=', token: Symbols.GreaterOrEq },
    { match: '<=', token: Symbols.LessOrEq },
    { match: '>', token: Symbols.GreaterThan },
    { match: '<', token: Symbols.LessThan },
    { match: '+', token: Symbols.Plus },
    { match: '-', token: Symbols.Minus },
    { match: /\d+(?:\.\d*)?(?:e-?\d+)?/, token: Symbols.Digits },
    { match: /'(?:[^']|'')*'/, token: Symbols.String },
    { match: /'(?:[^']|'')*/, token: Symbols.NonterminatingString },
    { match: /"(?:[^"]|"")*"/, token: Symbols.String },
    { match: /"(?:[^"]|"")*/, token: Symbols.NonterminatingString },
];

function makeRegexesAtStart(patterns: TokenPattern[]) {
    for (let token of patterns) {
        if (token.match instanceof RegExp) {
            token.match = new RegExp('^(?:' + token.match.source + ')', 'i');
        }
        if (token.pushState) {
            makeRegexesAtStart(token.pushState);
        }
    }
}
makeRegexesAtStart(tokenPatterns);

export function tokenize(lines: string[]): Symbols.Token[] {
    const tokens: Symbols.Token[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLocaleLowerCase();
        let j = 0;
        const states = [tokenPatterns];
        nextToken: while (j < line.length) {
            const substr = line.substr(j);
            for (let tokenPattern of states[states.length - 1]) {
                let tokenText: string | undefined;
                let match: RegExpMatchArray | null;
                if (tokenPattern.match instanceof RegExp && (match = substr.match(tokenPattern.match))) {
                    // Preserve case of matching chars
                    tokenText = lines[i].substring(j, j + match[0].length);
                } else if (typeof tokenPattern.match === 'string'
                    && substr.indexOf(tokenPattern.match.toLocaleLowerCase()) === 0
                    // Make sure string matches are on word boundries
                    && (j + tokenPattern.match.length === line.length - 1
                        || tokenPattern.match[tokenPattern.match.length - 1].match(/\W/)
                        || substr[j + tokenPattern.match.length] === undefined
                        || substr[j + tokenPattern.match.length].match(/\W/)
                    )
                ) {
                    tokenText = tokenPattern.match;
                }
                if (tokenText) {
                    if (tokenPattern.token) {
                        tokens.push(new tokenPattern.token(i, j, tokenText));
                    }
                    j += tokenText.length;
                    if (tokenPattern.popState) {
                        states.pop();
                    }
                    if (tokenPattern.pushState) {
                        states.push(tokenPattern.pushState);
                    }
                    continue nextToken;
                }
            }
            tokens.push(new Symbols.UnexpectedToken(i, j, line[j]));
            j++;
        }
    }
    const eofLine = lines.length - 1;
    const eofCol = lines[0] ? lines[0].length : 0;
    tokens.push(new Symbols.EOF(eofLine, eofCol, tokens[tokens.length - 1]));
    return tokens;
}
