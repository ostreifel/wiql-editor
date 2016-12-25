import { IErrorChecker } from "./IErrorChecker";
import { IParseResults, parse } from "../compiler/wiqlParser";
import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";
import { symbolsOfType, toDecoration } from "./errorCheckUtils";
import * as Symbols from "../compiler/wiqlSymbols";
import { definedVariables } from "../wiqlDefinition";

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
        "Contains": { target: "literal", class: Symbols.Contains },
        "Contains Words": { target: "literal", class: Symbols.ContainsWords },
        "Under": { target: "literal", class: Symbols.Under },
        "in": { target: "group", class: Symbols.In },
        "= [Field]": { target: "field", class: Symbols.Equals },
        "<> [Field]": { target: "field", class: Symbols.NotEquals },
        "> [Field]": { target: "field", class: Symbols.GreaterThan },
        "< [Field]": { target: "field", class: Symbols.LessThan },
        ">= [Field]": { target: "field", class: Symbols.GreaterOrEq },
        "<= [Field]": { target: "field", class: Symbols.LessOrEq },
    };

interface IComparisonType {
    fieldType: FieldType;
    literal: Function[];
    field: Function[];
    group: Function[];
}
export class TypeErrorChecker {
    private readonly fieldLookup: {
        [fieldName: string]: IComparisonType
    };
    constructor(fields: WorkItemField[]) {
        // Build field lookup
        this.fieldLookup = {};
        for (let field of fields) {
            const compType: IComparisonType = {
                fieldType: field.type,
                literal: [],
                field: [],
                group: []
            };
            this.fieldLookup[field.name.toLocaleLowerCase()] = this.fieldLookup[field.referenceName.toLocaleLowerCase()] = compType;
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
        if ("link type" in this.fieldLookup) {
            const field = this.fieldLookup["link type"];
            field.fieldType = FieldType.String;
            field.group = [];
            field.literal = [Symbols.Equals, Symbols.NotEquals];
            field.field = [];
        }
    }
    private checkComparisonOperator(comp: Symbols.ConditionalOperator, field: Symbols.Field, rhsType: "literal" | "field"): monaco.editor.IModelDeltaDecoration[] {
        const operatorToken = comp.conditionToken;
        const validOps: Function[] = this.fieldLookup[field.identifier.text.toLocaleLowerCase()][rhsType];
        if (validOps.length === 0) {
            return [toDecoration(operatorToken, `There is no valid operation for ${field.identifier} and ${rhsType}`)];
        }
        if (validOps.filter((op) => operatorToken instanceof op).length === 0) {
            const message = `Valid comparisons are ${validOps.map((op) => Symbols.getSymbolName(op)).join(", ")}`;
            return [toDecoration(operatorToken, message)];
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
    private checkRhsField(targetField: Symbols.Field, expectedType: FieldType): monaco.editor.IModelDeltaDecoration[] {
        if (targetField.identifier.text.toLocaleLowerCase() in this.fieldLookup
            && this.fieldLookup[targetField.identifier.text.toLocaleLowerCase()].fieldType !== expectedType) {
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
    public check(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[] {
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        const allConditions = [
            ...symbolsOfType<Symbols.ConditionalExpression>(parseResult, Symbols.ConditionalExpression),
            ...symbolsOfType<Symbols.LinkCondition>(parseResult, Symbols.LinkCondition),
        ];
        const fieldConditions = allConditions.filter((c) => c.field !== undefined && c.conditionalOperator !== undefined);
        for (let condition of allConditions) {
            if (!condition.field || !(condition.field.identifier.text.toLocaleLowerCase() in this.fieldLookup)) {
                continue;
            }
            const type = this.fieldLookup[condition.field.identifier.text.toLocaleLowerCase()].fieldType;
            if (condition.conditionalOperator && condition.value) {
                const field = condition.field;
                const rhsType = this.getRhsType(condition.value);

                const compErrors = this.checkComparisonOperator(condition.conditionalOperator, condition.field, rhsType);
                if (compErrors.length > 0) {
                    errors.push(...compErrors);
                    continue;
                }
                if (condition.value.value instanceof Symbols.Field) {
                    const targetField: Symbols.Field = condition.value.value;
                    errors.push(...this.checkRhsField(targetField, type));
                } else {
                    errors.push(...this.checkRhsValue(condition.value, type));
                }
            } else if (condition.valueList) {
                errors.push(...this.checkRhsGroup(condition.valueList, type));
            }
        }
        return errors;
    }
}
