import { IParseResults, ParseError } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { toDecoration } from "./errorDecorations";
import { IErrorChecker } from "./IErrorChecker";
import * as Q from "q";

enum ComparisonType {
    Literal,
    Field,
    Group,
    Invalid
}

export class SyntaxErrorChecker implements IErrorChecker {
    public check(parseResult: IParseResults): Q.IPromise<monaco.editor.IModelDeltaDecoration[]> {
        if (!(parseResult instanceof ParseError)) {
            return Q([]);
        }
        let errorToken: Symbols.Token;
        let hoverMessage: string;
        if (parseResult.errorToken instanceof Symbols.EOF) {
            errorToken = parseResult.errorToken.prev;
            hoverMessage = parseResult.expectedTokens.length === 1 ?
                `Should be followed by ${parseResult.expectedTokens[0]}` :
                `Should be followed by one of {${parseResult.expectedTokens.join(", ")}}`;
        } else {
            errorToken = parseResult.errorToken;
            hoverMessage = parseResult.expectedTokens.length === 1 ?
                `Expected ${parseResult.expectedTokens[0]}` :
                `Expected one of {${parseResult.expectedTokens.join(", ")}}`;
        }
        const decoration = toDecoration(errorToken, hoverMessage);
        decoration.range = decoration.range.setEndPosition(Infinity, Infinity);
        return Q([decoration]);
    }
}
