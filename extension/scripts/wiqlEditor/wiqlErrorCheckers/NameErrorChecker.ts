import { IErrorChecker } from "./IErrorChecker";
import { IParseResults } from "../compiler/wiqlParser";
import * as Symbols from "../compiler/wiqlSymbols";
import { definedVariables } from "../wiqlDefinition";
import { toDecoration, symbolsOfType } from "./errorCheckUtils";
import { fields } from "../../cachedData/fields";
import { CachedValue } from "../../cachedData/CachedValue";
import * as Q from "q";

export class NameErrorChecker implements IErrorChecker {
    private readonly validFieldIdentifiers: CachedValue<string[]> = new CachedValue(() => {
        return fields.getValue().then(fields => {
            const validFieldIdentifiers: string[] = [];
            for (const field of fields) {
                validFieldIdentifiers.push(field.name.toLocaleLowerCase());
                validFieldIdentifiers.push(field.referenceName.toLocaleLowerCase());
            }
            return validFieldIdentifiers;
        });
    });
    public check(parseResult: IParseResults): Q.IPromise<monaco.editor.IModelDeltaDecoration[]> {
        return this.validFieldIdentifiers.getValue().then(validFieldIdentifiers => {
            const errors: monaco.editor.IModelDeltaDecoration[] = [];
            // variable name errors
            const variables = symbolsOfType<Symbols.Variable>(parseResult, Symbols.Variable);
            for (const variable of variables) {
                if (!(variable.text.toLocaleLowerCase() in definedVariables)) {
                    errors.push(toDecoration(variable, `Valid names are include {${Object.keys(definedVariables).join(", ")}}`));
                }
            }
            // field name errors
            const identifiers = symbolsOfType<Symbols.Identifier>(parseResult, Symbols.Identifier);
            for (const identifier of identifiers) {
                if (validFieldIdentifiers.indexOf(identifier.text.toLocaleLowerCase()) < 0) {
                    errors.push(toDecoration(identifier, "Field does not exist"));
                }
            }
            return errors;
        });
    }
}
