import { FieldType } from "TFS/WorkItemTracking/Contracts";
import * as Symbols from "./symbols";

export interface TokenPattern {
    match: string | RegExp;
    /** (i,j,text) => void */
    token?;
    pushState?: TokenPattern[];
    popState?: boolean;

    /** For completion logic */
    valueTypes?: FieldType[];
}

function makeRegexesAtStart(patterns: TokenPattern[]): TokenPattern[] {
    return patterns.map((p) => {
        let match;
        if (p.match instanceof RegExp) {
            match = new RegExp("^(?:" + p.match.source + ")", "i");
        } else {
            match = p.match;
        }
        return {
            match: match,
            token: p.token,
            pushState: p.pushState && makeRegexesAtStart(p.pushState),
            popState: p.popState
        };
    });
}

export function tokenize(lines: string[], patterns: TokenPattern[]) {
    patterns = makeRegexesAtStart(patterns);
    const tokens: Symbols.Token[] = [];
    const states = [patterns];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLocaleLowerCase();
        let j = 0;
        nextToken: while (j < line.length) {
            const substr = line.substr(j);
            for (const tokenPattern of states[states.length - 1]) {
                let tokenText: string | undefined;
                let match: RegExpMatchArray | null;
                if (tokenPattern.match instanceof RegExp && (match = substr.match(tokenPattern.match))) {
                    // Preserve case of matching chars
                    tokenText = lines[i].substring(j, j + match[0].length);
                } else if (typeof tokenPattern.match === "string"
                    && substr.indexOf(tokenPattern.match.toLocaleLowerCase()) === 0
                    // Make sure string matches are on word boundries
                    && (j + tokenPattern.match.length === line.length - 1
                        || tokenPattern.match[tokenPattern.match.length - 1].match(/\W/)
                        || substr[tokenPattern.match.length] === undefined
                        || substr[tokenPattern.match.length].match(/\W/)
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
        }
    }
    return tokens;
}
