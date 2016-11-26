import * as Symbols from './wiqlSymbols';
import {rules, IRule} from './wiqlRules';

export class RulePosition {
    constructor(readonly rule: IRule, readonly pos: number) {
    }
    public nextInput() {
        return this.rule.inputs[this.pos];
    }
    public isAtEnd() {
        return this.rule.inputs.length === this.pos;
    }
    public advance() {
        return new RulePosition(this.rule, this.pos + 1);
    }
}
export class State {
    readonly transitionSymbols: {[symbolName: string]: any} = {};
    readonly transitions: {[symbolName: string]: State} = {};
    constructor(readonly rulePositions: RulePosition[]) {
    }
    public addTransition(symbol, state: State) {

    }
}
export const dfa: State = new State(rules.map((r) => new RulePosition(r, 0)));


function buildTransitions(state: State) {
    //copy arr
    let rulePositions = state.rulePositions.filter((pos) => !pos.isAtEnd());
    while(rulePositions.length > 0) {
        const symbol = rulePositions[0].nextInput();
        const nextPositions = rulePositions.filter((s) => s.nextInput() === symbol)
            .map((s) => s.advance());
        rulePositions = rulePositions.filter((s) => s.nextInput() !== symbol);
        const nextState = new State(nextPositions);
        state.transitions[Symbols.getSymbolName(symbol)] = nextState;
        buildTransitions(nextState);
    }
}
buildTransitions(dfa);
