import { IErrorChecker } from './IErrorChecker';
import { WorkItemField } from 'TFS/WorkItemTracking/Contracts';
import { IParseResults, parse } from '../wiqlParser';
import * as Symbols from '../wiqlSymbols';
import { validVariableNames } from '../wiqlDefinition';
import { toDecoration, symbolsOfType } from './errorCheckUtils';

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
                errors.push(toDecoration(variable, `Valid names are include {${validVariableNames.join(', ')}}`));
            }
        }
        // field name errors
        const identifiers = symbolsOfType<Symbols.Identifier>(parseResult, Symbols.Identifier);
        for (let identifier of identifiers) {
            if (this.validFieldIdentifiers.indexOf(identifier.value) < 0) {
                errors.push(toDecoration(identifier, 'Field does not exist'));
            }
        }
        return errors;
    }
}
