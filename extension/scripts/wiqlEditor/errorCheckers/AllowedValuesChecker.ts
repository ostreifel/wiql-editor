import { IParseResults } from "../compiler/parser";
import { IErrorChecker } from "./IErrorChecker";
import { CachedValue } from "../../cachedData/CachedValue";
import { toDecoration } from "./errorDecorations";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import * as Symbols from "../compiler/symbols";


export class AllowedValuesChecker implements IErrorChecker {
    constructor(readonly fieldRefName: string, readonly fieldName: string, readonly allowedValuesVal: CachedValue<string[]>, readonly errorMessage?: string) {
    }
    public async check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const allConditions = [
            ...symbolsOfType<Symbols.ConditionalExpression>(parseResult, Symbols.ConditionalExpression),
            ...symbolsOfType<Symbols.LinkCondition>(parseResult, Symbols.LinkCondition),
        ];
        const fieldIds = [this.fieldName.toLocaleLowerCase(), this.fieldRefName.toLocaleLowerCase()];
        const fieldConditions = allConditions.filter(c => c.field && fieldIds.indexOf(c.field.identifier.text.toLocaleLowerCase()) >= 0);
        if (fieldConditions.length === 0) {
            return [];
        }
        let allowedValues = await this.allowedValuesVal.getValue();
        allowedValues = [...allowedValues.map(v => `"${v.toLocaleLowerCase()}"`), ...allowedValues.map(v => `'${v.toLocaleLowerCase()}'`)];
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        for (const condition of fieldConditions) {
            if (condition.value && condition.value.value instanceof Symbols.String &&
                allowedValues.indexOf(condition.value.value.text.toLocaleLowerCase()) < 0) {
                errors.push(toDecoration(this.errorMessage || `Invalid ${this.fieldName} value`, condition.value));
            }
            let valueList = condition.valueList;
            while (valueList && valueList.value) {
                if (valueList.value.value instanceof Symbols.String &&
                    allowedValues.indexOf(valueList.value.value.text.toLocaleLowerCase()) < 0) {
                    errors.push(toDecoration(this.errorMessage || `Invalid ${this.fieldName} value`, valueList.value));
                }
                valueList = valueList.restOfList;
            }
        }
        return errors;
    }
}
