
/**
 * Tokenizes the value to wiql tokens. Uses own logic b/c monaco does not expose it's tokenizer
 */
export function tokenize(value: string[]): string[] {
    value = value.toLowerCase();
    const tokens: string[] = [];
    for (let i = 0; i < value.length; i++) {
        const char = value.charAt(i);
        //ignore whitespace
        if (' \r\t\n'.indexOf(char) >= 0) {
            //skip whitespace
        //keywords/identifiers
        } else if (char.match(/[a-z_]/)) {
            const word = value.substr(i).match(/^[a-z_][\w_]*/)[0];
            tokens.push(word);
            i += word.length - 1;
        } else if ('-0123456789'.indexOf(char) >= 0) {
            const substr = value.substr(i);
            const numberMatch = substr.match(/^-?\d+(?:\.\d*)?(?:e-?\d+)?/);
            if (numberMatch) {
                tokens.push(numberMatch[0]);
                i += numberMatch[0].length - 1;
            }
        //special chars
        } else if ('<>=()[],'.indexOf(char) >= 0) {
            const substr = value.substr(i, 2);
            for (let op of ['<>', '<=', '>=', '<', '>', '=', '[', ']', '[', ']', ',']) {
                if (substr.indexOf(op) == 0) {
                    tokens.push(op);
                    i += op.length - 1;
                    break;
                }
            }
        } else if (char === "'") {
            const str = value.substr(i).match(/^'(?:[^']|'')*'?/)[0];
            tokens.push(str);
            i += str.length - 1;
        } else if (char === '"') {
            const str = value.substr(i).match(/^"(?:[^"]|"")*"?/)[0];
            tokens.push(str);
            i += str.length - 1;
        }
    }
    return tokens;
}