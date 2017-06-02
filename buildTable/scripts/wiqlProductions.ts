// import * as Symbols from './symbols';
import { Rule as EbnfRule, InputType, Grouping, Optionals } from './ebnfParser';

export interface IProduction {
    /** nameof ? extends typeof Symbols.Symbol */
    result: string;
    /** nameof (? extends typeof Symbols.Symbol)[] */
    inputs: string[];
}
function toProductionInputs(inputs: InputType[], prodInputs: string[][] = [[]]): string[][] {
    for (const input of inputs) {
        let nextInput: string[][] = [];
        if (typeof input === 'string') {
            nextInput = [[input]];
        } else if (input instanceof Grouping) {
            for (const groupingProd of input.inputs) {
                nextInput.push(...toProductionInputs(groupingProd));
            }
        } else if (input instanceof Optionals) {
            for (const optionProd of input.inputs) {
                nextInput.push(...toProductionInputs(optionProd));
            }
            nextInput.push([]);
        }

        // prodInputs and nextInput -- this is the core logic that allows the ebnf to be so compact even when the productions are not
        const newProdInputs: string[][] = [];
        for( const prevInputs of prodInputs) {
            for (const nextInputs of nextInput) {
                const inputs = [...prevInputs, ...nextInputs];
                newProdInputs.push(inputs);
            }
        }
        prodInputs = newProdInputs;
    }
    return prodInputs;
}

function toProductions(rule: EbnfRule): IProduction[] {
    const productions: IProduction[] = [];
    for (const ruleInputs of rule.inputs) {
        const prodInputs: string[] = [];
        for (const prodInputs of toProductionInputs(ruleInputs)) {
            productions.push({
                result: rule.result,
                inputs: prodInputs
            })
        }
    }
    return productions;
}
export class Productions {
    private readonly rules: {[name: string]: IProduction[]};
    public readonly startSymbols: string[];
    constructor(rules: EbnfRule[]) {
        this.rules = {};
        for (const rule of rules) {
            this.rules[rule.result] = toProductions(rule);
        }
        this.startSymbols = [];
        for (const rule of rules) {
            if (this.startSymbols.indexOf(rule.result) < 0 && this.getProductionsUsing(rule.result).length === 0) {
                this.startSymbols.push(rule.result);
            }
        }
    }
    public isTokenClass(symbol: string) {
        return !(symbol in this.rules);
    }
    public getProductionsFor(symbolClass: string): IProduction[] {
        return this.rules[symbolClass] || [];
    }
    private getProductionsUsing(symbolClass: string): IProduction[] {
        const productionsUsing: IProduction[] = [];
        for (let result in this.rules) {
            const prods = this.rules[result];
            for (const prod of prods) {
                if (prod.inputs.indexOf(symbolClass) >= 0) {
                    productionsUsing.push(prod);
                }
            }
        }
        return productionsUsing;
    }
    private firstImpl(result: string, visited: string[]): string[] {
        if (this.isTokenClass(result)) {
            return [result];
        }
        const firsts: string[] = [];
        visited.push(result);
        for (const prod of this.getProductionsFor(result)) {
            const first = prod.inputs[0];
            if (this.isTokenClass(first)) {
                if (firsts.indexOf(first) < 0) {
                    firsts.push(first);
                }
            } else if (visited.indexOf(first) < 0) {
                for (const symbol of this.firstImpl(first, visited)) {
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
        for (const prod of this.getProductionsUsing(resultSymbol)) {
            const idx = prod.inputs.indexOf(resultSymbol);
            let recFollows: string[] = [];
            if (idx === prod.inputs.length - 1) {
                if (visited.indexOf(prod.result) < 0) {
                    recFollows = this.followsImpl(prod.result, visited);
                }
            } else {
                recFollows = this.first(prod.inputs[idx + 1]);
            }
            for (const sym of recFollows) {
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