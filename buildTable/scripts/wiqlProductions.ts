// import * as Symbols from './wiqlSymbols';
import { Rule as EbnfRule, InputType, Grouping, Optionals } from './ebnfParser';

export interface IProduction {
    /** nameof ? extends typeof Symbols.Symbol */
    result: string;
    /** nameof (? extends typeof Symbols.Symbol)[] */
    inputs: string[];
}
function toProductionInputs(inputs: InputType[], prodInputs: string[][] = [[]]): string[][] {
    for (let input of inputs) {
        let nextInput: string[][] = [];
        if (typeof input === 'string') {
            nextInput = [[input]];
        } else if (input instanceof Grouping) {
            for (let groupingProd of input.inputs) {
                nextInput.push(...toProductionInputs(groupingProd));
            }
        } else if (input instanceof Optionals) {
            for (let optionProd of input.inputs) {
                nextInput.push(...toProductionInputs(optionProd));
            }
            nextInput.push([]);
        }

        // prodInputs and nextInput -- this is the core logic that allows the ebnf to be so compact even the the productions are not
        const newProdInputs: string[][] = [];
        for( let prevInputs of prodInputs) {
            for (let nextInputs of nextInput) {
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
    for (let ruleInputs of rule.inputs) {
        const prodInputs: string[] = [];
        for (let prodInputs of toProductionInputs(ruleInputs)) {
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
        for (let rule of rules) {
            this.rules[rule.result] = toProductions(rule);
        }
        this.startSymbols = [];
        for (let rule of rules) {
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
            for (let prod of prods) {
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