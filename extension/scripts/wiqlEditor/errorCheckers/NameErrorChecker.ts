import { IErrorChecker } from "./IErrorChecker";
import { IParseResults } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { definedVariables, lowerDefinedVariables } from "../wiqlDefinition";
import { toDecoration } from "./errorDecorations";
import { fieldsVal } from "../../cachedData/fields";
import { CachedValue } from "../../cachedData/CachedValue";
import { symbolsOfType } from "../parseAnalysis/findSymbol";

export class NameErrorChecker implements IErrorChecker {
    private readonly validFieldIdentifiers: CachedValue<string[]> = new CachedValue(async () => {
        const fields = await fieldsVal.getValue();
        const validFieldIdentifiers: string[] = [];
        for (const field of fields.values) {
            validFieldIdentifiers.push(field.name.toLocaleLowerCase());
            validFieldIdentifiers.push(field.referenceName.toLocaleLowerCase());
        }
        return validFieldIdentifiers;
    });
    public async check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const validFieldIdentifiers = await this.validFieldIdentifiers.getValue();
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        // variable name errors
        const variables = symbolsOfType<Symbols.Variable>(parseResult, Symbols.Variable);
        for (const variable of variables) {
            if (!(variable.text.toLocaleLowerCase() in lowerDefinedVariables)) {
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
    }
}
