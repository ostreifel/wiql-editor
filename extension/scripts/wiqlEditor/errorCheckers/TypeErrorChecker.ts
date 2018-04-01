import { FieldType } from "TFS/WorkItemTracking/Contracts";

import { CachedValue } from "../../cachedData/CachedValue";
import { FieldLookup, fieldsVal } from "../../cachedData/fields";
import { IParseResults } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import { lowerDefinedVariables } from "../wiqlDefinition";
import { decorationFromSym } from "./errorDecorations";
import { IErrorChecker } from "./IErrorChecker";

export interface IComparisonType {
    fieldType: FieldType;
    literal: Function[];
    field: Function[];
    group: Function[];
}
interface IFieldLookup {
    [fieldName: string]: IComparisonType;
}

const compTypes: { [FieldType: number]: IComparisonType } = {};
/** Map of field type to the valid comparisons for it, this works for most fields.
 * For use specifically by getFieldComparisonLookup
 */
function addCompTypes(types: FieldType[], literal: Function[], group: Function[], field: Function[]) {
    for (const fieldType of types) {
        compTypes[fieldType] = {
            fieldType,
            field,
            group,
            literal,
        };
    }
}
addCompTypes([FieldType.Html, FieldType.PlainText, FieldType.History],
    [Symbols.Contains, Symbols.ContainsWords], [], []);
addCompTypes([FieldType.Double, FieldType.Integer, FieldType.DateTime, FieldType.Guid],
    [Symbols.Equals, Symbols.NotEquals, Symbols.GreaterThan, Symbols.LessThan, Symbols.GreaterOrEq, Symbols.LessOrEq, Symbols.Ever],
    [Symbols.In],
    [Symbols.Equals, Symbols.NotEquals, Symbols.GreaterThan, Symbols.LessThan, Symbols.GreaterOrEq, Symbols.LessOrEq]);
addCompTypes([FieldType.String],
    [Symbols.Equals, Symbols.NotEquals, Symbols.GreaterThan, Symbols.LessThan, Symbols.GreaterOrEq, Symbols.LessOrEq, Symbols.Ever, Symbols.Contains, Symbols.InGroup],
    [Symbols.In],
    [Symbols.Equals, Symbols.NotEquals, Symbols.GreaterThan, Symbols.LessThan, Symbols.GreaterOrEq, Symbols.LessOrEq]);
addCompTypes([FieldType.Boolean],
    [Symbols.Equals, Symbols.NotEquals, Symbols.Ever],
    [],
    [Symbols.Equals, Symbols.NotEquals]);
addCompTypes([FieldType.TreePath],
    [Symbols.Equals, Symbols.NotEquals, Symbols.Under],
    [Symbols.In],
    []);

export interface IFieldComparisonLookup {
    [fieldName: string]: IComparisonType;
}
const comparisonLookupCache: {[id: number]: IFieldComparisonLookup} = {};

export function getFieldComparisonLookup(fields: FieldLookup) {
    if (!(fields.lookupId in comparisonLookupCache)) {
        const fieldLookup: IFieldComparisonLookup = {};
        for (const field of fields.values) {
            if ("System.Links.LinkType" === field.referenceName) {
                fieldLookup[field.name.toLocaleLowerCase()] = fieldLookup[field.referenceName.toLocaleLowerCase()] = {
                    fieldType: FieldType.String,
                    group: [],
                    literal: [Symbols.Equals, Symbols.NotEquals],
                    field: [],
                };
            } else {
                fieldLookup[field.name.toLocaleLowerCase()] = fieldLookup[field.referenceName.toLocaleLowerCase()] = compTypes[field.type];
            }
        }
        comparisonLookupCache[fields.lookupId] = fieldLookup;
    }
    return comparisonLookupCache[fields.lookupId];
}
export class TypeErrorChecker implements IErrorChecker {
    private readonly fieldLookup: CachedValue<IFieldLookup> = new CachedValue(async () =>
        getFieldComparisonLookup(await fieldsVal.getValue()),
    );
    private checkComparisonOperator(fieldLookup: IFieldLookup, comp: Symbols.ConditionalOperator, field: Symbols.Field, rhsType: "literal" | "field"): monaco.editor.IModelDeltaDecoration[] {
        const operatorToken = comp.conditionToken;
        const validOps: Function[] = fieldLookup[field.identifier.text.toLocaleLowerCase()][rhsType];
        if (validOps.length === 0) {
            return [decorationFromSym(`There is no valid operation for ${field.identifier.text} and ${rhsType}`, operatorToken)];
        }
        if (validOps.filter((op) => operatorToken instanceof op).length === 0) {
            const message = `Valid comparisons are ${validOps.map((op) => Symbols.getSymbolName(op)).join(", ")}`;
            return [decorationFromSym(message, operatorToken)];
        }
        return [];
    }
    private checkAllowsGroup(fieldLookup: IFieldLookup, comp: Symbols.In, field: Symbols.Field): monaco.editor.IModelDeltaDecoration[] {
        const validOps: Function[] = fieldLookup[field.identifier.text.toLocaleLowerCase()].group;
        if (validOps.length === 0) {
            return [decorationFromSym(`${field.identifier.text} does not support group comparisons`, comp)];
        }
        if (validOps.filter((op) => comp instanceof op).length === 0) {
            const message = `Valid comparisons are ${validOps.map((op) => Symbols.getSymbolName(op)).join(", ")}`;
            return [decorationFromSym(message, comp)];
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
    private checkRhsValue({value}: Symbols.Value, expectedType: FieldType): monaco.editor.IModelDeltaDecoration[] {
        const symbolType = this.mapType(expectedType);
        const error = decorationFromSym(`Expected value of type ${Symbols.getSymbolName(symbolType)}`, value);
        // Potentially additonal checkers to validate value formats here: ex date and guid validators
        if (value instanceof Symbols.VariableExpression) {
            const varType = this.mapType(lowerDefinedVariables[value.name.text.toLocaleLowerCase()]);
            return varType === symbolType ? [] : [error];
        }
        switch (expectedType) {
            case FieldType.String:
                return value instanceof symbolType ? [] : [error];
            case FieldType.Integer:
                return value instanceof symbolType ? [] : [error];
            case FieldType.DateTime:
                return value instanceof symbolType ? [] : [error];
            case FieldType.PlainText:
                return value instanceof symbolType ? [] : [error];
            case FieldType.Html:
                return value instanceof symbolType ? [] : [error];
            case FieldType.TreePath:
                return value instanceof symbolType ? [] : [error];
            case FieldType.History:
                return value instanceof symbolType ? [] : [error];
            case FieldType.Double:
                return value instanceof symbolType ? [] : [error];
            case FieldType.Guid:
                return value instanceof symbolType ? [] : [error];
            case FieldType.Boolean:
                return value instanceof Symbols.True || value instanceof Symbols.False ? [] :
                    [decorationFromSym(`Expected value of type BOOLEAN`, value)];
        }
        throw new Error(`Unexpected field type ${expectedType}`);
    }
    private checkRhsGroup(valueList: Symbols.ValueList, expectedType: FieldType): monaco.editor.IModelDeltaDecoration[] {
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        let currList: Symbols.ValueList | undefined = valueList;
        while (currList) {
            if (currList.value.value instanceof Symbols.Field) {
                errors.push(decorationFromSym("Values in list must be literals", currList.value.value));
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
            return [decorationFromSym(`Expected field of type ${FieldType[expectedType]}`, targetField.identifier)];
        }
        return [];
    }
    private getRhsType(value: Symbols.Value): "field" | "literal" {
        if (value && value.value instanceof Symbols.Field) {
            return "field";
        }
        return "literal";
    }
    public async check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const fieldLookup = await this.fieldLookup.getValue();
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        const allConditions = [
            ...symbolsOfType<Symbols.ConditionalExpression>(parseResult, Symbols.ConditionalExpression),
            ...symbolsOfType<Symbols.LinkCondition>(parseResult, Symbols.LinkCondition),
        ];
        for (const condition of allConditions) {
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
    }
}
