import { parse, IParseResults, ParseError } from './wiqlParser';
import * as Symbols from './wiqlSymbols';
import { validVariableNames } from './wiqlDefinition';
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";

function toPosition(token: Symbols.Token) {
    return new monaco.Range(
        token.line + 1,
        token.startColumn + 1,
        token.line + 1,
        token.endColumn + 1,
    );
}
function findSyntaxErrors(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[] {
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
/**
 * Recurse through each symbol as a tree and return the ones of type
 * @argument class returned symbols should be an instanceof
 */
function symbolsOfType<T extends Symbols.Symbol>(parseResult: IParseResults, type: Function): T[] {
    const stack: Symbols.Symbol[] = [];
    if (parseResult instanceof ParseError) {
        stack.push(...parseResult.parsedTokens);
    } else {
        stack.push(parseResult);
    }
    const matchingSymbols: T[] = [];
    while (stack.length) {
        const symbol = <Symbols.Symbol>stack.pop();
        for (let key in symbol) {
            const prop = symbol[key];
            if (prop instanceof type) {
                matchingSymbols.push(prop);
            }
            if (prop instanceof Symbols.Symbol) {
                stack.push(prop);
            }
        }
    }
    return matchingSymbols;
}
function findNameErrors(parseResult: IParseResults, validFieldIdentifiers: string[]): monaco.editor.IModelDeltaDecoration[] {
    const errors: monaco.editor.IModelDeltaDecoration[] = [];
    //variable name errors
    const variables = symbolsOfType<Symbols.Variable>(parseResult, Symbols.Variable);
    for (let variable of variables) {
        if (validVariableNames.indexOf(variable.name) < 0) {
            errors.push({
                range: toPosition(variable),
                options: {
                    hoverMessage: `Valid names are include {${validVariableNames.join(', ')}}`,
                    className: 'wiql-error',
                    linesDecorationsClassName: 'wiql-error-margin',
                }
            });
        }
    }
    //field name errors
    const identifiers = symbolsOfType<Symbols.Identifier>(parseResult, Symbols.Identifier);
    for (let identifier of identifiers) {
        if (validFieldIdentifiers.indexOf(identifier.value) < 0) {
            errors.push({
                range: toPosition(identifier),
                options: {
                    hoverMessage: 'Field does not exist',
                    className: 'wiql-error',
                    linesDecorationsClassName: 'wiql-error-margin',
                }
            });
        }
    }
    return errors;
}
function findTypeErrors(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[] {
    throw new Error('Unimplemented');
}
function getValidFieldIdentifiers(fields: WorkItemField[]): string[] {
    const identifiers: string[] = [];
    for (let field of fields) {
        identifiers.push(field.name.toLocaleLowerCase());
        identifiers.push(field.referenceName.toLocaleLowerCase());
    }
    return identifiers;
}

export function getErrorHighlighter(model: monaco.editor.IModel, fields: WorkItemField[]): (event) => void {
    let oldDecorations: string[] = [];
    const validFieldIdentifiers = getValidFieldIdentifiers(fields);
    return (event) => {
        const lines = model.getLinesContent();
        const parseResult = parse(lines);
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        errors.push(...findSyntaxErrors(parseResult));
        errors.push(...findNameErrors(parseResult, validFieldIdentifiers));
        oldDecorations = model.deltaDecorations(oldDecorations, errors);
    };
}