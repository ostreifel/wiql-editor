import { IParseResults } from "../compiler/wiqlParser";
import { IErrorChecker } from "./IErrorChecker";
import * as Q from "q";
import { CachedValue } from "../../cachedData/CachedValue";
import { symbolsOfType, toDecoration } from "./errorCheckUtils";
import * as Symbols from "../compiler/wiqlSymbols";


export class AllowedValuesChecker implements IErrorChecker {
    constructor(readonly fieldRefName: string, readonly fieldName: string, readonly allowedValues: CachedValue<string[]>, readonly errorMessage?: string) {
    }
    public check(parseResult: IParseResults): Q.IPromise<monaco.editor.IModelDeltaDecoration[]> {
        const allConditions = [
            ...symbolsOfType<Symbols.ConditionalExpression>(parseResult, Symbols.ConditionalExpression),
            ...symbolsOfType<Symbols.LinkCondition>(parseResult, Symbols.LinkCondition),
        ];
        const fieldIds = [this.fieldName.toLocaleLowerCase(), this.fieldRefName.toLocaleLowerCase()];
        const fieldConditions = allConditions.filter(c => c.field && fieldIds.indexOf(c.field.identifier.text.toLocaleLowerCase()) >= 0);
        if (fieldConditions.length === 0) {
            return Q([]);
        }
        return this.allowedValues.getValue().then(allowedValues => {
            allowedValues = [...allowedValues.map(v => `"${v.toLocaleLowerCase()}"`), ...allowedValues.map(v => `'${v.toLocaleLowerCase()}'`)];
            const errors: monaco.editor.IModelDeltaDecoration[] = [];
            for (let condition of fieldConditions) {
                if (condition.value && condition.value.value instanceof Symbols.String &&
                    allowedValues.indexOf(condition.value.value.text.toLocaleLowerCase()) < 0) {
                    errors.push(toDecoration(condition.value, this.errorMessage || `Invalid ${this.fieldName} value`));
                }
                let valueList = condition.valueList;
                while (valueList && valueList.value) {
                    if (valueList.value.value instanceof Symbols.String &&
                        allowedValues.indexOf(valueList.value.value.text.toLocaleLowerCase()) < 0) {
                        errors.push(toDecoration(valueList.value, this.errorMessage || `Invalid ${this.fieldName} value`));
                    }
                    valueList = valueList.restOfList;
                }
            }
            return errors;
        });
    }
}
