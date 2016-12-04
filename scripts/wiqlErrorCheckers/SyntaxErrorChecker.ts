import { IParseResults, ParseError, parse } from '../wiqlParser';
import * as Symbols from '../wiqlSymbols';
import { toPosition } from './errorCheckUtils';

enum ComparisonType {
    Literal,
    Field,
    Group,
    Invalid
}

export class SyntaxErrorChecker {
    public check(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[] {
    if (!(parseResult instanceof ParseError)) {
        return [];
    }
    let errorToken: Symbols.Token;
    let hoverMessage: string;
    if (parseResult.errorToken instanceof Symbols.EOF) {
        errorToken = parseResult.errorToken.prev;
        hoverMessage = parseResult.expectedTokens.length === 1 ?
            `Should be followed by ${parseResult.expectedTokens[0]}` :
            `Should be followed by one of {${parseResult.expectedTokens.join(', ')}}`;
    } else {
        errorToken = parseResult.errorToken;
        hoverMessage = parseResult.expectedTokens.length === 1 ?
            `Expected ${parseResult.expectedTokens[0]}` :
            `Expected one of {${parseResult.expectedTokens.join(', ')}}`;
    }
    const decorations: monaco.editor.IModelDeltaDecoration[] = [{
        range: toPosition(errorToken),
        options: {
            hoverMessage: hoverMessage,
            className: 'wiql-error',
            linesDecorationsClassName: 'wiql-error-margin',
        }
    }];
    return decorations;
    }
}
