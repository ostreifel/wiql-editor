import * as Symbols from './wiqlSymbols';
import {IProduction, getProductionsFor} from './wiqlProductions';

export class ProductionPosition {
    constructor(readonly production: IProduction, readonly pos: number) {
    }
    public nextInput() {
        return this.production.inputs[this.pos];
    }
    public isAtEnd() {
        return this.production.inputs.length === this.pos;
    }
    public advance() {
        return new ProductionPosition(this.production, this.pos + 1);
    }
    public equals(prodPos: ProductionPosition) {
        //                                instance equality is fine for rules
        return prodPos.pos === this.pos && prodPos.production === this.production;
    }
}
function compareProdPos(a: ProductionPosition, b: ProductionPosition): number {
        if (a.pos !== b.pos) {
            return a.pos - b.pos;
        }
        if (a.production.result !== b.production.result) {
            return a.production.result < b.production.result ? -1 : 1;
        }
        if (a.production.inputs.length !== b.production.inputs.length) {
            return a.production.inputs.length - b.production.inputs.length;
        }
        for (let i = 0; i < b.production.inputs.length; i++) {
            if (a.production.inputs[i] !== b.production.inputs[i]) {
                return a.production.inputs[i] < b.production.inputs[i] ? -1 : 1;
            }
        }
        return 0;
}
export class State {
    private sorted = false;
    constructor(readonly productionPositions: ProductionPosition[]) {
    }
    /**
     * returns true if the production position was not already added
     */
    public addProductionPosition(prodPos: ProductionPosition) {
        if (this.sorted) { throw new Error('State is frozen'); }
        if (this.productionPositions.filter((r) => r.equals(prodPos)).length === 0) {
            this.productionPositions.push(prodPos);
            return true;
        }
        return false;
    }
    public sort() {
        if (!this.sorted) {
            this.productionPositions.sort(compareProdPos);
            this.sorted = true;
        }
        return this;
    }
    public equals(state: State) {
        if (this.productionPositions.length !== state.productionPositions.length) {
            return false;
        }
        this.sort();
        state.sort();
        for (let i = 0 ; i < this.productionPositions.length; i++) {
            if (!this.productionPositions[i].equals(state.productionPositions[i])) {
                return false;
            }
        }
        return true;
    }
}
export class Transition {
    constructor(readonly from: number, readonly to: number, readonly symbolClass) {
    }
    public equals(other: Transition) {
        return (
            this.symbolClass === other.symbolClass 
            && this.from === other.from
            && this.to === other.to
        );
    }
}

function closure(state: State) {
    let change: boolean;
    do {
        change = false;
        for (let pos of state.productionPositions) {
            for (let prod of getProductionsFor(pos.nextInput())) {
                const newProdPos = new ProductionPosition(prod, 0);
                if (state.addProductionPosition(newProdPos)) {
                    change = true;
                }
            }
        }
    } while (change);
    return state.sort();
}
function goto(state: State, symbolClass: Function) {
    const productions: ProductionPosition[] = [];
    for (let pos of state.productionPositions) {
        if (pos.nextInput() === symbolClass) {
            productions.push(pos.advance());
        }
    }
    return closure(new State(productions));
}

function addIfNotPresent(arr: {equals: (other) => boolean}[], obj: {equals: (other) => boolean}): [boolean, number] {
    for (let idx in arr) {
        if (arr[idx].equals(obj)) {
            return [false, Number(idx)];
        }
    }
    const idx = arr.push(obj) - 1;
    return [true, idx];
}
function calcStatesAndEdges(): [State[], Transition[]] {
    const states: State[] = [];
    const transitions: Transition[] = [];

    const selectProductions = getProductionsFor(Symbols.FlatSelect);
    const selectZeros = selectProductions.map((p) => new ProductionPosition(p, 0));
    states.push(closure(new State(selectZeros)));
    let change: boolean;
    do {
        change = false;
        for (let stateIdx in states) {
            const state = states[stateIdx];
            for (let prodPos of state.productionPositions.filter((pos) => !pos.isAtEnd())) {
                const symbolClass = prodPos.nextInput();
                const nextState = goto(state, symbolClass);
                const [stateAdded, nextStateIdx] = addIfNotPresent(states, nextState); 
                const transition = new Transition(Number(stateIdx), nextStateIdx, symbolClass);
                const transitionAdded = addIfNotPresent(transitions, transition)[0];
                if (stateAdded || transitionAdded) {
                    change = true;
                }
            }
        }
    } while (change);
    return [states, transitions];
}
export const [states, transitions] = calcStatesAndEdges();

// //Debug info
// function replacer(k, v) {
// 	if (typeof v === 'function') {
// 		return Symbols.getSymbolName(v);
// 	}
// 	return v;
// }
// console.log(JSON.stringify(states, replacer));
// console.log(JSON.stringify(transitions, replacer));

// //Check for ambiguous states
// let ambigousStates = 0;
// for (let stateIdx in states) {
//     const state = states[stateIdx];
//     if (state.productionPositions.filter((pos) => pos.isAtEnd()).length > 0 && state.productionPositions.length > 1) {
//         console.log(`Ambiguous resolution at ${stateIdx}`);
//         ambigousStates++;
//     }
// }
// console.log(`Counted ${ambigousStates} ambiguous resolutions`);

// //Check for ambiguous end transitions
// const transitionIds = {};
// for (let transitionIdx in transitions) {
//     const transition = transitions[transitionIdx];
//     const id = `${transition.from}->${transition.to} : ${Symbols.getSymbolName(transition.symbolClass)}`;
//     if (transitionIds[id]) {
//         console.log(`ambiguous transition at ${transitionIdx}: ${id}`);
//     } else {
//         transitionIds[id] = id;
//     }
// }
// console.log(`ambiguous transition count ${transitions.length - Object.keys(transitionIds).length}`);


