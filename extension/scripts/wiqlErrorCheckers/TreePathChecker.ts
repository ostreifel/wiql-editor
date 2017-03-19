import { IParseResults } from "../compiler/wiqlParser";
import { IErrorChecker } from "./IErrorChecker";
import * as Q from "q";
import { iterationStrings, areaStrings } from "../cachedData/nodes";
import { CachedValue } from "../cachedData/CachedValue";
import { symbolsOfType, toDecoration } from "./errorCheckUtils";
import * as Symbols from "../compiler/wiqlSymbols";


export class TreePathChecker implements IErrorChecker {
    private checkConditions(conditions: Symbols.ConditionalExpression[], validValues: CachedValue<string[]>) {
        if (conditions.length === 0) {
            return Q([]);
        }
        return validValues.getValue().then(validValues => {
            validValues = validValues.map(v => v.toLocaleLowerCase());
            const errors: monaco.editor.IModelDeltaDecoration[] = [];
            for (let condition of conditions) {
                if (condition.value && condition.value.value instanceof Symbols.String &&
                    validValues.indexOf(condition.value.value.text.toLocaleLowerCase()) < 0) {
                    errors.push(toDecoration(condition.value, "Invalid path"));
                }
            }
            return errors;
        });
    }
    public check(parseResult: IParseResults): Q.IPromise<monaco.editor.IModelDeltaDecoration[]> {
        const allConditions = [
            ...symbolsOfType<Symbols.ConditionalExpression>(parseResult, Symbols.ConditionalExpression),
            ...symbolsOfType<Symbols.LinkCondition>(parseResult, Symbols.LinkCondition),
        ];
        const areaNames = ["system.areapath", "area path"];
        const areaConditions = allConditions.filter(c => c.field && areaNames.indexOf(c.field.identifier.text.toLocaleLowerCase()) >= 0);
        const iterationNames = ["system.iterationpath", "iteration path"];
        const iterationConditions = allConditions.filter(c => c.field && iterationNames.indexOf(c.field.identifier.text.toLocaleLowerCase()) >= 0);
        return Q.all([this.checkConditions(areaConditions, areaStrings),
            this.checkConditions(iterationConditions, iterationStrings)]).then(([areaErrors, iterationErrors]) =>
                [...areaErrors, ...iterationErrors]);
    }
}