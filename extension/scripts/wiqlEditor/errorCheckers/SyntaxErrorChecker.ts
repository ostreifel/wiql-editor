import { IParseResults, ParseError } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { toDecoration } from "./errorDecorations";
import { IErrorChecker } from "./IErrorChecker";

export class SyntaxErrorChecker implements IErrorChecker {
    public async check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]> {
        if (!(parseResult instanceof ParseError)) {
            return [];
        }
        let errorToken: Symbols.Token;
        let hoverMessage: string;
        if (parseResult.errorToken instanceof Symbols.EOF) {
            // Query === "", don't try to highlight
            if (!parseResult.errorToken.prev) {
                return [];
            }
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
        const decoration = toDecoration(hoverMessage, errorToken);
        decoration.range = decoration.range.setEndPosition(Infinity, Infinity);
        return [decoration];
    }
}
