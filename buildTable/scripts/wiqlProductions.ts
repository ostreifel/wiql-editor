// import * as Symbols from './wiqlSymbols';
import { Rule as EbnfRule } from './ebnfParser';
export interface IProduction {
    /** nameof ? extends typeof Symbols.Symbol */
    result: string;
    /** nameof (? extends typeof Symbols.Symbol)[] */
    inputs: string[];
}
/*
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
*/
export class Productions {
    private readonly productions: IProduction[];
    private readonly tokens: string[];
    constructor(rules: EbnfRule[]) {
        //TODO generate productions
    }
    public isTokenClass(symbol: string) {
        return this.tokens.indexOf(symbol) >= 0;
    }
    public getProductionsFor(symbolClass: string): IProduction[] {
        return this.productions.filter((r) => r.result === symbolClass);
    }
    private getProductionsUsing(symbolClass: string): IProduction[] {
        return this.productions.filter((p) =>
            p.inputs.filter((input) => input === symbolClass).length > 0
        );
    }
    private firstImpl(result: string, visited: string[]): string[] {
        if (this.isTokenClass(result)) {
            return [result];
        }
        const firsts: string[] = [];
        visited.push(result);
        for (let prod of this.getProductionsFor(result)) {
            const first = prod.inputs[0];
            if (this.isTokenClass(first)) {
                if (firsts.indexOf(first) < 0) {
                    firsts.push(first);
                }
            } else if (visited.indexOf(first) < 0) {
                for (let symbol of this.firstImpl(first, visited)) {
                    if (firsts.indexOf(symbol) < 0) {
                        firsts.push(symbol);
                    }
                }
            }
        }
        return firsts;
    }

    public first(result: string): string[] {
        return this.firstImpl(result, []);
    }

    private followsImpl(resultSymbol: string, visited: string[]): string[] {
        const follows: string[] = ["EOF"];
        visited.push(resultSymbol);
        for (let prod of this.getProductionsUsing(resultSymbol)) {
            const idx = prod.inputs.indexOf(resultSymbol);
            let recFollows: string[] = [];
            if (idx === prod.inputs.length - 1) {
                if (visited.indexOf(prod.result) < 0) {
                    recFollows = this.followsImpl(prod.result, visited);
                }
            } else {
                recFollows = this.first(prod.inputs[idx + 1]);
            }
            for (let sym of recFollows) {
                if (follows.indexOf(sym) < 0) {
                    follows.push(sym);
                }
            }
        }

        return follows;
    }
    public follows(resultSymbol: string): string[] {
        return this.followsImpl(resultSymbol, []);
    }
}