import * as Symbols from './wiqlSymbols';

export const symbolMap = {
    select: Symbols.Select,
    from: Symbols.From,
    where: Symbols.Where,
    order: Symbols.Order,
    by: Symbols.By,
    asc: Symbols.Asc,
    desc: Symbols.Desc,
    asof: Symbols.Asof,
    not: Symbols.Not,
    ever: Symbols.Ever,
    in: Symbols.In,
    like: Symbols.Like,
    under: Symbols.Under,
    workitems: Symbols.WorkItems,
    workitemlinks: Symbols.WorkItemLinks,
    and: Symbols.And,
    or: Symbols.Or,
    contains: Symbols.Contains,
    words: Symbols.Words
};
export const opMap = {
    '(': Symbols.LParen,
    ')': Symbols.RParen,
    '[': Symbols.LSqBracket,
    ']': Symbols.RSqBracket,
    ',': Symbols.Comma,
    '=': Symbols.Equals,
    '<>': Symbols.NotEquals,
    '>': Symbols.GreaterThan,
    '<': Symbols.LessThan,
    '>=': Symbols.GreaterOrEq,
    '<=': Symbols.LessOrEq,
    '+': Symbols.Plus,
    '-': Symbols.Minus
};
/**
 * Tokenizes the value to wiql tokens. Uses own logic b/c monaco does not expose it's tokenizer
 */
export function tokenize(lines: string[]): Symbols.Token[] {
    const tokens: Symbols.Token[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        for (let j = 0; j < line.length; ) {

            const char = line.charAt(j);
            // ignore whitespace
            if (' \r\t\n'.indexOf(char) >= 0) {
                j++;
            // keywords/identifiers
            } else if (char.match(/[a-z_]/)) {
                const word = (<RegExpMatchArray>line.substr(j).match(/^[a-z_][\w_\.]*/))[0];
                const type = symbolMap[word];
                if (type) {
                    tokens.push(new type(i, j, j + word.length));
                } else {
                    tokens.push(new Symbols.Identifier(i, j, word));
                }
                j += word.length;
            } else if ('0123456789'.indexOf(char) >= 0) {
                const substr = line.substr(j);
                const numberMatch = substr.match(/^\d+(?:\.\d*)?(?:e-?\d+)?/);
                if (numberMatch) {
                    tokens.push(new Symbols.Digits(i, j, numberMatch[0]));
                    j += numberMatch[0].length;
                } else {
                    tokens.push(new Symbols.UnexpectedToken(i, j, char));
                    j++;
                }
            } else if ('@' === char || line.indexOf('[any]') === j) {
                const substr = line.substr(j);
                const match = substr.match(/^@\w*|^\[any\]/);
                if (match) {
                    tokens.push(new Symbols.Variable(i, j, match[0]));
                    j += match[0].length;
                } else {
                    tokens.push(new Symbols.UnexpectedToken(i , j, char));
                    j++;
                }
            // special chars
            } else if ('<>=()[],+-'.indexOf(char) >= 0) {
                const substr = line.substr(j, 2);
                for (let op of ['<>', '<=', '>=', '<', '>', '=', '[', ']', '(', ')', ',', '+', '-']) {
                    if (substr.indexOf(op) === 0) {
                        tokens.push(new opMap[op](i, j, j + op.length));
                        j += op.length;
                        if (op === '[') {
                            // using brackets allows spaces in identifier
                            const match = line.substr(j).match(/[^,;'`:~\\\/\*|?"&%$!+=()[\]{}<>-]+/);
                            if (match) {
                                const word = match[0];
                                tokens.push(new Symbols.Identifier(i, j, word));
                                j += word.length;
                            }
                        }
                        break;
                    }
                }
            } else if (char === '\'') {
                const str = (line.substr(j).match(/^'(?:[^']|'')*'?/) || [])[0];
                if (str[str.length - 1] === '\'') {
                    tokens.push(new Symbols.String(i, j, str));
                } else {
                    tokens.push(new Symbols.NonterminatingString(i, j, str));
                }
                j += str.length;
            } else if (char === '"') {
                const str = (line.substr(j).match(/^"(?:[^"]|"")*"?/) || [])[0];
                if (str[str.length - 1] === '"') {
                    tokens.push(new Symbols.String(i, j, str));
                } else {
                    tokens.push(new Symbols.NonterminatingString(i, j, str));
                }
                j += str.length;
            } else {
                tokens.push(new Symbols.UnexpectedToken(i, j, char));
                j++;
            }
        }
    }
    const eofLine = lines.length - 1;
    const eofCol = lines[0] ? lines[0].length : 0;
    tokens.push(new Symbols.EOF(eofLine, eofCol, tokens[tokens.length - 1]));
    return tokens;
}
