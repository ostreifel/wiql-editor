import * as Symbols from './wiqlSymbols';
export interface IProduction {
    /** ? extends typeof Symbols.Symbol */
    result: Function,
    /** (? extends typeof Symbols.Symbol)[] */
    inputs: Function[],
    fromInputs: (inputs: Symbols.Symbol[]) => Symbols.Symbol
}
const productions: IProduction[] = [
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems
        ],
        fromInputs: (inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems
        ]) => new Symbols.FlatSelect(inputs[1])
    },
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Where,
            Symbols.LogicalExpression
        ],
        fromInputs: (inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Where,
            Symbols.LogicalExpression
        ]) => new Symbols.FlatSelect(inputs[1], inputs[5])
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
            Symbols.OrderByFieldList
        ],
        fromInputs: (inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Where,
            Symbols.LogicalExpression,
            Symbols.Order,
            Symbols.By,
            Symbols.OrderByFieldList
        ]) => new Symbols.FlatSelect(inputs[1], inputs[5], inputs[8])
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
            Symbols.DateTime
        ],
        fromInputs: (inputs: [
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
            Symbols.DateTime
        ]) =>  new Symbols.FlatSelect(inputs[1], inputs[5], inputs[8], inputs[10])
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
            Symbols.DateTime
        ],
        fromInputs: (inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Order,
            Symbols.By,
            Symbols.OrderByFieldList,
            Symbols.Asof,
            Symbols.DateTime
        ]) => new Symbols.FlatSelect(inputs[1], undefined, inputs[6], inputs[8])
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
            Symbols.OrderByFieldList
        ],
        fromInputs: (inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Order,
            Symbols.By,
            Symbols.OrderByFieldList
        ]) => new Symbols.FlatSelect(inputs[1], undefined, inputs[6])
    },
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Asof,
            Symbols.DateTime
        ],
        fromInputs: (inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Asof,
            Symbols.DateTime
        ]) => new Symbols.FlatSelect(inputs[1], undefined, undefined, inputs[5])
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
            Symbols.Asof,
            Symbols.DateTime
        ],
        fromInputs: (inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.Where,
            Symbols.LogicalExpression,
            Symbols.Asof,
            Symbols.DateTime
        ]) => new Symbols.FlatSelect(inputs[1], inputs[5], undefined, inputs[7])
    },
    {
        result: Symbols.FieldList,
        inputs: [
            Symbols.Field
        ],
        fromInputs: (inputs: [
            Symbols.Field
        ]) => new Symbols.FieldList(inputs[0])
    },
    {
        result: Symbols.FieldList,
        inputs: [
            Symbols.Field,
            Symbols.Comma,
            Symbols.FieldList
        ],
        fromInputs: (inputs: [
            Symbols.Field,
            Symbols.Comma,
            Symbols.FieldList
        ]) => new Symbols.FieldList(inputs[0], inputs[2])
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ],
        fromInputs: (inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ]) => new Symbols.LogicalExpression(inputs[1], inputs[0], inputs[2], inputs[3])
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ],
        fromInputs: (inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ]) => new Symbols.LogicalExpression(inputs[1], inputs[0], inputs[2], inputs[3])
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression
        ],
        fromInputs: (inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression
        ]) => new Symbols.LogicalExpression(inputs[1], inputs[0])
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ],
        fromInputs: (inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ]) => new Symbols.LogicalExpression(inputs[1], inputs[0], inputs[2], inputs[3])
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ],
        fromInputs: (inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ]) => new Symbols.LogicalExpression(inputs[1], inputs[0], inputs[2], inputs[3])
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression
        ],
        fromInputs: (inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression
        ]) => new Symbols.LogicalExpression(inputs[1], inputs[0])
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ],
        fromInputs: (inputs: [
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ]) => new Symbols.LogicalExpression(inputs[0], undefined, inputs[1], inputs[2])
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ],
        fromInputs: (inputs: [
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ]) => new Symbols.LogicalExpression(inputs[0], undefined, inputs[1], inputs[2])
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.ConditionalExpression
        ],
        fromInputs: (inputs: [
            Symbols.ConditionalExpression
        ]) => new Symbols.LogicalExpression(inputs[0])
    },
    {
        result: Symbols.ConditionalExpression,
        inputs: [
            Symbols.LParen,
            Symbols.LogicalExpression,
            Symbols.RParen
        ],
        fromInputs: (inputs: [
            Symbols.LParen,
            Symbols.LogicalExpression,
            Symbols.RParen
        ]) => new Symbols.ConditionalExpression(inputs[1])
    },
    {
        result: Symbols.ConditionalExpression,
        inputs: [
            Symbols.Field,
            Symbols.ConditionalOperator,
            Symbols.Value
        ],
        fromInputs: (inputs: [
            Symbols.Field,
            Symbols.ConditionalOperator,
            Symbols.Value
        ]) => new Symbols.ConditionalExpression(inputs[0], inputs[1], inputs[2])
    },
    {
        result: Symbols.ConditionalExpression,
        inputs: [
            Symbols.Field,
            Symbols.In,
            Symbols.LParen,
            Symbols.ValueList,
            Symbols.RParen
        ],
        fromInputs: (inputs: [
            Symbols.Field,
            Symbols.In,
            Symbols.LParen,
            Symbols.ValueList,
            Symbols.RParen
        ]) => new Symbols.ConditionalExpression(inputs[0], true, inputs[3])
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
        ],
        fromInputs: (inputs: [
            Symbols.Field,
            Symbols.Not,
            Symbols.In,
            Symbols.LParen,
            Symbols.ValueList,
            Symbols.RParen
        ]) => new Symbols.ConditionalExpression(inputs[0], false, inputs[4])
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.Number
        ],
        fromInputs: (inputs: [
            Symbols.Number
        ]) => new Symbols.Value(inputs[0])
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.String
        ],
        fromInputs: (inputs: [
            Symbols.String
        ]) => new Symbols.Value(inputs[0])
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.DateTime
        ],
        fromInputs: (inputs: [
            Symbols.DateTime
        ]) => new Symbols.Value(inputs[0])
    },
    {
        result: Symbols.DateTime,
        inputs: [
            Symbols.String
        ],
        fromInputs: (inputs: [
            Symbols.String
        ]) => new Symbols.DateTime(inputs[0])
    },
    {
        result: Symbols.ValueList,
        inputs: [
            Symbols.Value,
            Symbols.Comma,
            Symbols.ValueList
        ],
        fromInputs: (inputs: [
            Symbols.Value,
            Symbols.Comma,
            Symbols.ValueList
        ]) => new Symbols.ValueList(inputs[0], inputs[2])
    },
    {
        result: Symbols.ValueList,
        inputs: [
            Symbols.Value
        ],
        fromInputs: (inputs: [
            Symbols.Value
        ]) => new Symbols.ValueList(inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Equals
        ],
        fromInputs: (inputs: [
            Symbols.Equals
        ]) => new Symbols.ConditionalOperator(inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.NotEquals
        ],
        fromInputs: (inputs: [
            Symbols.NotEquals
        ]) => new Symbols.ConditionalOperator(inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.LessThan
        ],
        fromInputs: (inputs: [
            Symbols.LessThan
        ]) => new Symbols.ConditionalOperator(inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.LessOrEq
        ],
        fromInputs: (inputs: [
            Symbols.LessOrEq
        ]) => new Symbols.ConditionalOperator(inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.GreaterThan
        ],
        fromInputs: (inputs: [
            Symbols.GreaterThan
        ]) => new Symbols.ConditionalOperator(inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.GreaterOrEq
        ],
        fromInputs: (inputs: [
            Symbols.GreaterOrEq
        ]) => new Symbols.ConditionalOperator(inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Like
        ],
        fromInputs: (inputs: [
            Symbols.Like
        ]) => new Symbols.ConditionalOperator(inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Like
        ],
        fromInputs: (inputs: [
            Symbols.Ever,
            Symbols.Like
        ]) => new Symbols.ConditionalOperator(inputs[1], inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Not,
            Symbols.Like
        ],
        fromInputs: (inputs: [
            Symbols.Ever,
            Symbols.Not,
            Symbols.Like
        ]) => new Symbols.ConditionalOperator(inputs[2], inputs[0], inputs[1])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Not,
            Symbols.Like
        ],
        fromInputs: (inputs: [
            Symbols.Not,
            Symbols.Like
        ]) => new Symbols.ConditionalOperator(inputs[1], undefined, inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Under
        ],
        fromInputs: (inputs: [
            Symbols.Under
        ]) => new Symbols.ConditionalOperator(inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Under
        ],
        fromInputs: (inputs: [
            Symbols.Ever,
            Symbols.Under
        ]) => new Symbols.ConditionalOperator(inputs[1], inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Not,
            Symbols.Under
        ],
        fromInputs: (inputs: [
            Symbols.Ever,
            Symbols.Not,
            Symbols.Under
        ]) => new Symbols.ConditionalOperator(inputs[2], inputs[0], inputs[1])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Not,
            Symbols.Under
        ],
        fromInputs: (inputs: [
            Symbols.Not,
            Symbols.Under
        ]) => new Symbols.ConditionalOperator(inputs[1], undefined, inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Contains
        ],
        fromInputs: (inputs: [
            Symbols.Contains
        ]) => new Symbols.ConditionalOperator(inputs[0])
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.ContainsWords
        ],
        fromInputs: (inputs: [
            Symbols.ContainsWords
        ]) => new Symbols.ConditionalOperator(inputs[0])
    },
    {
        result: Symbols.ContainsWords,
        inputs: [
            Symbols.Contains,
            Symbols.Words
        ],
        fromInputs: (inputs: [
            Symbols.Contains,
            Symbols.Words
        ]) => new Symbols.ContainsWords()
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field
        ],
        fromInputs: (inputs: [
            Symbols.Field
        ]) => new Symbols.OrderByFieldList(inputs[0])
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Asc
        ],
        fromInputs: (inputs: [
            Symbols.Field,
            Symbols.Asc
        ]) => new Symbols.OrderByFieldList(inputs[0], inputs[1])
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Desc
        ],
        fromInputs: (inputs: [
            Symbols.Field,
            Symbols.Desc
        ]) => new Symbols.OrderByFieldList(inputs[0], inputs[1])
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ],
        fromInputs: (inputs: [
            Symbols.Field,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ]) => new Symbols.OrderByFieldList(inputs[0], undefined, inputs[2])
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Asc,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ],
        fromInputs: (inputs: [
            Symbols.Field,
            Symbols.Asc,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ]) => new Symbols.OrderByFieldList(inputs[0], inputs[1], inputs[3])
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Desc,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ],
        fromInputs: (inputs: [
            Symbols.Field,
            Symbols.Desc,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ]) => new Symbols.OrderByFieldList(inputs[0], inputs[1], inputs[3])
    }
];
export function getProductionsFor(symbolClass: Function): IProduction[] {
    return productions.filter((r) => r.result === symbolClass);
}
function getProductionsUsing(symbolClass: Function): IProduction[] {
    return productions.filter((p) =>
        p.inputs.filter((input) => input === symbolClass).length > 0
    );
}
function firstImpl(result: Function, visited: Function[]): Function[] {
    if (Symbols.isTokenClass(result)) {
        return [result];
    }
    const firsts: Function[] = [];
    visited.push(result);
    for (let prod of getProductionsFor(result)) {
        const first = prod.inputs[0];
        if (Symbols.isTokenClass(first)) {
            if (firsts.indexOf(first) < 0) {
                firsts.push(first);
            }
        } else if (visited.indexOf(first) < 0) {
            for (let symbol of firstImpl(first, visited)) {
                if (firsts.indexOf(symbol) < 0) {
                    firsts.push(symbol);
                }
            }
        }
    }
    return firsts;
}
            
export function first(result: Function): Function[] {
    return firstImpl(result, []);
}

function followsImpl(resultSymbol: Function, visited: Function[]): Function[] {
    const follows: Function[] = [Symbols.EOF];
    visited.push(resultSymbol);
    for (let prod of getProductionsUsing(resultSymbol)) {
        const idx = prod.inputs.indexOf(resultSymbol);
        let recFollows: Function[] = [];
        if (idx === prod.inputs.length - 1) {
            if (visited.indexOf(prod.result) < 0) {
                recFollows = followsImpl(prod.result, visited);
            }
        } else {
            recFollows = first(prod.inputs[idx + 1])
        }
        for (let sym of recFollows) {
            if (follows.indexOf(sym) < 0) {
                follows.push(sym);
            }
        }
    }

    return follows;
}
export function follows(resultSymbol: Function): Function[] {
    return followsImpl(resultSymbol, []);
}
