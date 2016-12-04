import { IErrorChecker } from './IErrorChecker';
import { IParseResults, parse } from '../wiqlParser';
import { WorkItemField, FieldType } from 'TFS/WorkItemTracking/Contracts';
import { symbolsOfType, toDecoration } from './errorCheckUtils';
import * as Symbols from '../wiqlSymbols';

const operationLookup: {
    [opName: string]: {
        target: 'literal' | 'field' | 'group',
        class: Function
    }
} = {
        '=': { target: 'literal', class: Symbols.Equals },
        '<>': { target: 'literal', class: Symbols.NotEquals },
        '>': { target: 'literal', class: Symbols.GreaterThan },
        '<': { target: 'literal', class: Symbols.LessThan },
        '>=': { target: 'literal', class: Symbols.GreaterOrEq },
        '<=': { target: 'literal', class: Symbols.LessOrEq },
        'In Group': { target: 'literal', class: Symbols.InGroup },
        'Contains': { target: 'literal', class: Symbols.Contains },
        'Contains Words': { target: 'literal', class: Symbols.ContainsWords },
        'in': { target: 'group', class: Symbols.In },
        '= [Field]': { target: 'field', class: Symbols.Equals },
        '<> [Field]': { target: 'field', class: Symbols.NotEquals },
        '> [Field]': { target: 'field', class: Symbols.GreaterThan },
        '< [Field]': { target: 'field', class: Symbols.LessThan },
        '>= [Field]': { target: 'field', class: Symbols.GreaterOrEq },
        '<= [Field]': { target: 'field', class: Symbols.LessOrEq },
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
    }
    private getTargetType(value?: Symbols.Value, valueList?: Symbols.ValueList) {
        if (valueList) {
            return 'group';
        }
        if (value && value.value instanceof Symbols.Field) {
            return 'field';
        }
        return 'literal';
    }
    public check(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[] {
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        const allConditions = symbolsOfType<Symbols.ConditionalExpression>(parseResult, Symbols.ConditionalExpression);
        const fieldConditions = allConditions.filter((c) => c.field !== undefined && c.conditionalOperator !== undefined);
        for (let condition of allConditions) {
            if (condition.field && condition.conditionalOperator) {
                const operatorToken = condition.conditionalOperator.conditionToken;
                const field = condition.field;
                const target = this.getTargetType(condition.value, condition.valueList);
                if (!(field.identifier.value in this.fieldLookup)) {
                    continue;
                }
                const validOps: Function[] = this.fieldLookup[field.identifier.value][target];
                if (validOps.length === 0) {
                    errors.push(toDecoration(operatorToken, `There is no valid operation for ${field.identifier} and ${target}`));
                }
                if (validOps.filter((op) => operatorToken instanceof op).length === 0) {
                    const message = `Expected one of ${validOps.map((op) => Symbols.getSymbolName(op)).join(', ')}`;
                    errors.push( toDecoration(operatorToken, message));
                }
            }
        }
        return errors;
    }
}
