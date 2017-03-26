import { IErrorChecker } from "./IErrorChecker";
import { IParseResults } from "../compiler/wiqlParser";
import { FieldType } from "../vssContracts";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import { symbolsOfType, toDecoration } from "./errorCheckUtils";
import * as Symbols from "../compiler/wiqlSymbols";
import { definedVariables } from "../wiqlDefinition";
import { fields } from "../cachedData/fields";
import { CachedValue } from "../cachedData/CachedValue";
import * as Q from "q";

const operationLookup: {
    [opName: string]: {
        target: "literal" | "field" | "group",
        class: Function
    }
} = {
        "=": { target: "literal", class: Symbols.Equals },
        "<>": { target: "literal", class: Symbols.NotEquals },
        ">": { target: "literal", class: Symbols.GreaterThan },
        "<": { target: "literal", class: Symbols.LessThan },
        ">=": { target: "literal", class: Symbols.GreaterOrEq },
        "<=": { target: "literal", class: Symbols.LessOrEq },
        "In Group": { target: "literal", class: Symbols.InGroup },
        "Was Ever": { target: "literal", class: Symbols.Ever },
        "Contains": { target: "literal", class: Symbols.Contains },
        "Contains Words": { target: "literal", class: Symbols.ContainsWords },
        "Under": { target: "literal", class: Symbols.Under },
        "In": { target: "group", class: Symbols.In },
        "= [Field]": { target: "field", class: Symbols.Equals },
        "<> [Field]": { target: "field", class: Symbols.NotEquals },
        "> [Field]": { target: "field", class: Symbols.GreaterThan },
        "< [Field]": { target: "field", class: Symbols.LessThan },
        ">= [Field]": { target: "field", class: Symbols.GreaterOrEq },
        "<= [Field]": { target: "field", class: Symbols.LessOrEq },
    };

export interface IComparisonType {
    fieldType: FieldType;
    literal: Function[];
    field: Function[];
    group: Function[];
}
interface IFieldLookup {
    [fieldName: string]: IComparisonType;
}

export function getFieldComparisonLookup(fields: WorkItemField[]) {
    const fieldLookup: {[fieldName: string]: IComparisonType} = {};
    for (let field of fields) {
        const compType: IComparisonType = {
            fieldType: field.type,
            literal: [],
            field: [],
            group: []
        };
        fieldLookup[field.name.toLocaleLowerCase()] = fieldLookup[field.referenceName.toLocaleLowerCase()] = compType;
        for (let op of field.supportedOperations) {
            const opLookup = operationLookup[op.name];
            // Some ops are not mapped: negative ops (not contains, not in), was ever
            if (opLookup) {
                const classArr: Function[] = compType[opLookup.target];
                classArr.push(opLookup.class);
            }
        }
    }
    // link type wrong as returned by the server -- correct it
    if ("link type" in fieldLookup) {
        const field = fieldLookup["link type"];
        field.fieldType = FieldType.String;
        field.group = [];
        field.literal = [Symbols.Equals, Symbols.NotEquals];
        field.field = [];
    }
    return fieldLookup;
}
export class TypeErrorChecker implements IErrorChecker {
    private readonly fieldLookup: CachedValue<IFieldLookup> = new CachedValue(() =>
        fields.getValue().then(fields =>
            getFieldComparisonLookup(fields)
        )
    );
    private checkComparisonOperator(fieldLookup: IFieldLookup, comp: Symbols.ConditionalOperator, field: Symbols.Field, rhsType: "literal" | "field"): monaco.editor.IModelDeltaDecoration[] {
        const operatorToken = comp.conditionToken;
        const validOps: Function[] = fieldLookup[field.identifier.text.toLocaleLowerCase()][rhsType];
        if (validOps.length === 0) {
            return [toDecoration(operatorToken, `There is no valid operation for ${field.identifier.text} and ${rhsType}`)];
        }
        if (validOps.filter((op) => operatorToken instanceof op).length === 0) {
            const message = `Valid comparisons are ${validOps.map((op) => Symbols.getSymbolName(op)).join(", ")}`;
            return [toDecoration(operatorToken, message)];
        }
        return [];
    }
    private checkAllowsGroup(fieldLookup: IFieldLookup, comp: Symbols.In, field: Symbols.Field): monaco.editor.IModelDeltaDecoration[] {
        const validOps: Function[] = fieldLookup[field.identifier.text.toLocaleLowerCase()]["group"];
        if (validOps.length === 0) {
            return [toDecoration(comp, `${field.identifier.text} does not support group comparisons`)];
        }
        if (validOps.filter((op) => comp instanceof op).length === 0) {
            const message = `Valid comparisons are ${validOps.map((op) => Symbols.getSymbolName(op)).join(", ")}`;
            return [toDecoration(comp, message)];
        }
        return [];
    }

    private mapType(type: FieldType): Function {
        switch (type) {
            case FieldType.Integer:
            case FieldType.Double:
                return Symbols.Number;
            default:
                return Symbols.String;
        }
    }
    private checkRhsValue(value: Symbols.Value, expectedType: FieldType): monaco.editor.IModelDeltaDecoration[] {
        const symbolType = this.mapType(expectedType);
        const error = toDecoration(value.value, `Expected value of type ${Symbols.getSymbolName(symbolType)}`);
        // Potentially additonal checkers to validate value formats here: ex date and guid validators
        if (value.value instanceof Symbols.Variable) {
            const varType = this.mapType(definedVariables[value.value.text]);
            return varType === symbolType ? [] : [error];
        }
        switch (expectedType) {
            case FieldType.String:
                return value.value instanceof symbolType ? [] : [error];
            case FieldType.Integer:
                return value.value instanceof symbolType ? [] : [error];
            case FieldType.DateTime:
                return value.value instanceof symbolType ? [] : [error];
            case FieldType.PlainText:
                return value.value instanceof symbolType ? [] : [error];
            case FieldType.Html:
                return value.value instanceof symbolType ? [] : [error];
            case FieldType.TreePath:
                return value.value instanceof symbolType ? [] : [error];
            case FieldType.History:
                return value.value instanceof symbolType ? [] : [error];
            case FieldType.Double:
                return value.value instanceof symbolType ? [] : [error];
            case FieldType.Guid:
                return value.value instanceof symbolType ? [] : [error];
            case FieldType.Boolean:
                return value.value instanceof Symbols.True || value.value instanceof Symbols.False ? [] :
                    [toDecoration(value.value, `Expected value of type BOOLEAN`)];
        }
        throw new Error(`Unexpected field type ${expectedType}`);
    }
    private checkRhsGroup(valueList: Symbols.ValueList, expectedType: FieldType): monaco.editor.IModelDeltaDecoration[] {
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        let currList: Symbols.ValueList | undefined = valueList;
        while (currList) {
            if (currList.value.value instanceof Symbols.Field) {
                errors.push(toDecoration(currList.value.value, "Values in list must be literals"));
            } else {
                errors.push(...this.checkRhsValue(currList.value, expectedType));
            }
            currList = currList.restOfList;
        }
        return errors;
    }
    private checkRhsField(fieldLookup: IFieldLookup, targetField: Symbols.Field, expectedType: FieldType): monaco.editor.IModelDeltaDecoration[] {
        if (targetField.identifier.text.toLocaleLowerCase() in fieldLookup
            && fieldLookup[targetField.identifier.text.toLocaleLowerCase()].fieldType !== expectedType) {
            return [toDecoration(targetField.identifier, `Expected field of type ${FieldType[expectedType]}`)];
        }
        return [];
    }
    private getRhsType(value: Symbols.Value): "field" | "literal" {
        if (value && value.value instanceof Symbols.Field) {
            return "field";
        }
        return "literal";
    }
    public check(parseResult: IParseResults): Q.IPromise<monaco.editor.IModelDeltaDecoration[]> {
        return this.fieldLookup.getValue().then(fieldLookup => {
            const errors: monaco.editor.IModelDeltaDecoration[] = [];
            const allConditions = [
                ...symbolsOfType<Symbols.ConditionalExpression>(parseResult, Symbols.ConditionalExpression),
                ...symbolsOfType<Symbols.LinkCondition>(parseResult, Symbols.LinkCondition),
            ];
            for (let condition of allConditions) {
                if (!condition.field || !(condition.field.identifier.text.toLocaleLowerCase() in fieldLookup)) {
                    continue;
                }
                const type = fieldLookup[condition.field.identifier.text.toLocaleLowerCase()].fieldType;
                if (condition.conditionalOperator && condition.value) {
                    const rhsType = this.getRhsType(condition.value);

                    const compErrors = this.checkComparisonOperator(fieldLookup, condition.conditionalOperator, condition.field, rhsType);
                    if (compErrors.length > 0) {
                        errors.push(...compErrors);
                        continue;
                    }
                    if (condition.value.value instanceof Symbols.Field) {
                        const targetField: Symbols.Field = condition.value.value;
                        errors.push(...this.checkRhsField(fieldLookup, targetField, type));
                    } else {
                        errors.push(...this.checkRhsValue(condition.value, type));
                    }
                } else if (condition.valueList && condition.inOperator) {
                    errors.push(...this.checkRhsGroup(condition.valueList, type));
                    errors.push(...this.checkAllowsGroup(fieldLookup, condition.inOperator, condition.field));
                }
            }
            return errors;
        });
    }
}
