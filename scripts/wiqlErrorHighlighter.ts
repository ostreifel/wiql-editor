import {parse, ParseError} from './wiqlParser';
import * as Symbols from './wiqlSymbols';
export function getErrorHighlighter(editor: monaco.editor.IStandaloneCodeEditor): (event) => void {
    let oldDecorations: string[] = [];
    return (event) => {
        const model = editor.getModel();
        const lines = model.getLinesContent();
        const parseResult = parse(lines);
        if (!(parseResult instanceof ParseError)) {
            oldDecorations = model.deltaDecorations(oldDecorations, []);
            return;
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
            range: new monaco.Range(
                errorToken.line + 1,
                errorToken.startColumn + 1,
                errorToken.line + 1,
                errorToken.endColumn + 2,
            ),
            options: {
                hoverMessage: hoverMessage,
                className: 'wiql-error',
                linesDecorationsClassName: 'wiql-error-margin',
            }
        }];
        oldDecorations = model.deltaDecorations(oldDecorations, decorations);
    };
}