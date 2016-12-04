import { IErrorChecker } from './IErrorChecker';
import { WorkItemField } from 'TFS/WorkItemTracking/Contracts';
import { IParseResults, parse } from '../wiqlParser';
import * as Symbols from '../wiqlSymbols';
import { validVariableNames } from '../wiqlDefinition';
import { toPosition, symbolsOfType } from './errorCheckUtils';

export class NameErrorChecker implements IErrorChecker {
    private readonly validFieldIdentifiers: string[];
    constructor(fields: WorkItemField[]) {
        this.validFieldIdentifiers = [];
        for (let field of fields) {
            this.validFieldIdentifiers.push(field.name.toLocaleLowerCase());
            this.validFieldIdentifiers.push(field.referenceName.toLocaleLowerCase());
        }
    }
    public check(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[] {
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        // variable name errors
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
        // field name errors
        const identifiers = symbolsOfType<Symbols.Identifier>(parseResult, Symbols.Identifier);
        for (let identifier of identifiers) {
            if (this.validFieldIdentifiers.indexOf(identifier.value) < 0) {
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
}
