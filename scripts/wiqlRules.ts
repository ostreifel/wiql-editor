import * as Symbols from './wiqlSymbols';
export interface IRule {
    /** ? extends typeof Symbols.Symbol */
    result: any,
    /** (? extends typeof Symbols.Symbol)[] */
    inputs: any[]
}
export const rules = [
    {
        result: Symbols.FlatSelect,
        inputs: [Symbols.Select, 
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.EOF]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [Symbols.Select, 
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Where,
            Symbols.LogicalExpression,
            Symbols.EOF]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [Symbols.Select, 
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Where,
            Symbols.LogicalExpression,
            Symbols.Order,
            Symbols.By,
            Symbols.OrderByFieldList,
            Symbols.EOF]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [Symbols.Select, 
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
            Symbols.EOF]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [Symbols.Select, 
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Order,
            Symbols.By,
            Symbols.OrderByFieldList,
            Symbols.Asof,
            Symbols.DateTime,
            Symbols.EOF]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [Symbols.Select, 
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Order,
            Symbols.By,
            Symbols.OrderByFieldList,
            Symbols.EOF]
    },
    {
        result: Symbols.FlatSelect,
        inputs: [Symbols.Select, 
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Asof,
            Symbols.DateTime,
            Symbols.EOF]
    },
];