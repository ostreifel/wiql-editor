import * as Symbols from './wiqlSymbols';
export interface IProduction {
    /** ? extends typeof Symbols.Symbol */
    result: Function;
    /** (? extends typeof Symbols.Symbol)[] */
    inputs: Function[];
}
const productions: IProduction[] = [
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems
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
            Symbols.LogicalExpression
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
            Symbols.OrderBy,
            Symbols.OrderByFieldList
        ],
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
            Symbols.OrderBy,
            Symbols.OrderByFieldList,
            Symbols.Asof,
            Symbols.DateTime
        ],
    },
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.OrderBy,
            Symbols.OrderByFieldList,
            Symbols.Asof,
            Symbols.DateTime
        ],
    },
    {
        result: Symbols.FlatSelect,
        inputs: [
            Symbols.Select,
            Symbols.FieldList,
            Symbols.From,
            Symbols.WorkItems,
            Symbols.OrderBy,
            Symbols.OrderByFieldList
        ],
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
    },
    {
        result: Symbols.FieldList,
        inputs: [
            Symbols.Field
        ],
    },
    {
        result: Symbols.FieldList,
        inputs: [
            Symbols.Field,
            Symbols.Comma,
            Symbols.FieldList
        ],
    },
    {
        result: Symbols.Field,
        inputs: [
            Symbols.Identifier
        ],
    },
    {
        result: Symbols.Field,
        inputs: [
            Symbols.LSqBracket,
            Symbols.Identifier,
            Symbols.RSqBracket
        ],
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ],
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ],
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Not,
            Symbols.ConditionalExpression
        ],
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ],
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ],
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.Ever,
            Symbols.ConditionalExpression
        ],
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.ConditionalExpression,
            Symbols.Or,
            Symbols.LogicalExpression
        ],
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.ConditionalExpression,
            Symbols.And,
            Symbols.LogicalExpression
        ],
    },
    {
        result: Symbols.LogicalExpression,
        inputs: [
            Symbols.ConditionalExpression
        ],
    },
    {
        result: Symbols.ConditionalExpression,
        inputs: [
            Symbols.LParen,
            Symbols.LogicalExpression,
            Symbols.RParen
        ],
    },
    {
        result: Symbols.ConditionalExpression,
        inputs: [
            Symbols.Field,
            Symbols.ConditionalOperator,
            Symbols.Value
        ],
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
    },
    {
        result: Symbols.Number,
        inputs: [
            Symbols.Digits
        ],
    },
    {
        result: Symbols.Number,
        inputs: [
            Symbols.Minus,
            Symbols.Digits
        ],
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.Number
        ],
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.String
        ],
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.DateTime
        ],
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.Variable
        ],
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.Variable,
            Symbols.Minus,
            Symbols.Number
        ],
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.Variable,
            Symbols.Plus,
            Symbols.Number
        ],
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.True
        ],
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.False
        ],
    },
    {
        result: Symbols.Value,
        inputs: [
            Symbols.Field
        ],
    },
    {
        result: Symbols.DateTime,
        inputs: [
            Symbols.String
        ],
    },
    {
        result: Symbols.ValueList,
        inputs: [
            Symbols.Value,
            Symbols.Comma,
            Symbols.ValueList
        ],
    },
    {
        result: Symbols.ValueList,
        inputs: [
            Symbols.Value
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Equals
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.NotEquals
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.LessThan
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.LessOrEq
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.GreaterThan
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.GreaterOrEq
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Like
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Like
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Not,
            Symbols.Like
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Not,
            Symbols.Like
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Under
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Under
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Ever,
            Symbols.Not,
            Symbols.Under
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Not,
            Symbols.Under
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Contains
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.ContainsWords
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Not,
            Symbols.Contains
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Not,
            Symbols.ContainsWords
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.InGroup
        ],
    },
    {
        result: Symbols.ConditionalOperator,
        inputs: [
            Symbols.Not,
            Symbols.InGroup
        ],
    },
    {
        result: Symbols.ContainsWords,
        inputs: [
            Symbols.Contains,
            Symbols.Words
        ],
    },
    {
        result: Symbols.InGroup,
        inputs: [
            Symbols.In,
            Symbols.Group
        ],
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field
        ],
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Asc
        ],
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Desc
        ],
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ],
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Asc,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ],
    },
    {
        result: Symbols.OrderByFieldList,
        inputs: [
            Symbols.Field,
            Symbols.Desc,
            Symbols.Comma,
            Symbols.OrderByFieldList
        ],
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
            recFollows = first(prod.inputs[idx + 1]);
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
