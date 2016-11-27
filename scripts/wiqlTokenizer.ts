import * as Symbols from './wiqlSymbols';

const symbolMap = {
    select: Symbols.Select,
    where: Symbols.Where,
    order: Symbols.Order,
    by: Symbols.By,
    asc: Symbols.Asc,
    desc: Symbols.Desc,
    asof: Symbols.Asc,
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
const opMap = {
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
}
/**
 * Tokenizes the value to wiql tokens. Uses own logic b/c monaco does not expose it's tokenizer
 */
export function tokenize(lines: string[]): Symbols.Token[] {
    const tokens: Symbols.Token[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        for (let j = 0; j < line.length; i++) {

            const char = line.charAt(j);
            //ignore whitespace
            if (' \r\t\n'.indexOf(char) >= 0) {
                //skip whitespace
            //keywords/identifiers
            } else if (char.match(/[a-z_]/)) {
                const word = (line.substr(j).match(/^[a-z_][\w_\.]*/) || [])[0];
                const type = symbolMap[word];
                if (type) {
                    tokens.push(new type(i, j))
                } else {
                    tokens.push(new Symbols.Field(i, j, word));
                }
                j += word.length - 1;
            } else if ('-0123456789'.indexOf(char) >= 0) {
                const substr = line.substr(j);
                const numberMatch = substr.match(/^-?\d+(?:\.\d*)?(?:e-?\d+)?/);
                if (numberMatch) {
                    tokens.push(new Symbols.Number(i, j, numberMatch[0]));
                    j += numberMatch[0].length - 1;
                } else {
                    tokens.push(new Symbols.UnexpectedToken(i, j, char));
                }
            //special chars
            } else if ('<>=()[],'.indexOf(char) >= 0) {
                const substr = line.substr(j, 2);
                for (let op of ['<>', '<=', '>=', '<', '>', '=', '[', ']', '[', ']', ',']) {
                    if (substr.indexOf(op) == 0) {
                        tokens.push(new opMap[op](i, j));
                        j += op.length - 1;
                        break;
                    }
                }
            } else if (char === "'") {
                const str = (line.substr(j).match(/^'(?:[^']|'')*'?/) || [])[0];
                if (str[str.length - 1] === "'") {
                    tokens.push(new Symbols.String(i, j, str));
                } else {
                    tokens.push(new Symbols.NonterminatingString(i, j, str));
                }
                j += str.length - 1;
            } else if (char === '"') {
                const str = (line.substr(j).match(/^"(?:[^"]|"")*"?/) || [])[0];
                if (str[str.length - 1] === '"') {
                    tokens.push(new Symbols.String(i, j, str));
                } else {
                    tokens.push(new Symbols.NonterminatingString(i, j, str));
                }
                j += str.length - 1;
            } else {
                tokens.push(new Symbols.UnexpectedToken(i, j, char));
            }
        }
    }
    const eofLine = lines.length - 1;
    const eofCol = lines[0] ? lines[0].length : 0; 
    return tokens;
}