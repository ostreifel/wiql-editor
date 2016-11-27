import * as Symbols from './wiqlSymbols';
export interface IProduction {
    /** ? extends typeof Symbols.Symbol */
    result: Function,
    /** (? extends typeof Symbols.Symbol)[] */
    inputs: Function[]
}
const rules: IProduction[] = [
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.EOF
        ]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Where,
            Symbols.LogicalExpression,
            Symbols.EOF
        ]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Where,
            Symbols.LogicalExpression,
            Symbols.Order,
            Symbols.By,
            Symbols.OrderByFieldList,
            Symbols.EOF
        ]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Where,
            Symbols.LogicalExpression,
            Symbols.Order,
            Symbols.By,
            Symbols.OrderByFieldList,
            Symbols.Asof,
            Symbols.DateTime,
            Symbols.EOF
        ]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Order,
            Symbols.By,
            Symbols.OrderByFieldList,
            Symbols.Asof,
            Symbols.DateTime,
            Symbols.EOF
        ]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Order,
            Symbols.By,
            Symbols.OrderByFieldList,
            Symbols.EOF
        ]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Asof,
            Symbols.DateTime,
            Symbols.EOF
        ]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Where,
            Symbols.FieldList,
            Symbols.Asof,
            Symbols.DateTime,
            Symbols.EOF
        ]
    },
    {
        result: Symbols.FieldList,
        inputs: [
            Symbols.Field
        ]
    },
    {
        result: Symbols.FieldList,
        inputs: [
            Symbols.Field,
            Symbols.Comma,
            Symbols.FieldList
        ]
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ]
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ]
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression
        ]
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ]
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ]
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression
        ]
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ]
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ]
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.ConditionalExpression
        ]
    },
    {
        result: Symbols.ConditionalExpression,
        inputs: [
            Symbols.LParen,
            Symbols.LogicalExpression,
            Symbols.RParen
        ]
    },
    {
        result: Symbols.ConditionalExpression,
        inputs: [
            Symbols.Field,
            Symbols.ConditionalOperator,
            Symbols.Value
        ]
    },
    {
        result: Symbols.ConditionalExpression,
        inputs: [
            Symbols.Field,
            Symbols.In,
            Symbols.LParen,
            Symbols.ValueList,
            Symbols.RParen
        ]
    },
    {
        result: Symbols.ConditionalExpression,
        inputs: [
            Symbols.Field,
            Symbols.Not,
            Symbols.In,
            Symbols.LParen,
            Symbols.ValueList,
            Symbols.RParen
        ]
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.Number
        ]
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.String
        ]
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.DateTime
        ]
    },
    {
        result: Symbols.DateTime,
        inputs: [
            Symbols.String
        ]
    },
    {
        result: Symbols.ValueList,
        inputs: [
            Symbols.Value,
            Symbols.Comma,
            Symbols.ValueList
        ]
    },
    {
        result: Symbols.ValueList,
        inputs: [
            Symbols.Value
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Equals
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.NotEquals
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.LessThan
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.LessOrEq
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.GreaterThan
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.GreaterOrEq
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Like
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Like
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Not,
            Symbols.Like
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Not,
            Symbols.Like
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Under
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Under
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Not,
            Symbols.Under
        ]
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Not,
            Symbols.Under
        ]
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field
        ]
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Asc
        ]
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Desc
        ]
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ]
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Asc,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ]
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Desc,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ]
    }
];
export function getProductionsFor(symbolClass) {
    return rules.filter((r) => r.result === symbolClass);
}