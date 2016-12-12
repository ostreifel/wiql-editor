import { IProduction, Productions, startSymbols } from './wiqlProductions';

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
        //                                instance equality is fine for productions
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
        for (let i = 0; i < this.productionPositions.length; i++) {
            if (!this.productionPositions[i].equals(state.productionPositions[i])) {
                return false;
            }
        }
        return true;
    }
}
export class Transition {
    constructor(readonly from: number, readonly to: number, readonly symbolClass: string) {
    }
    public equals(other: Transition) {
        return (
            this.symbolClass === other.symbolClass
            && this.from === other.from
            && this.to === other.to
        );
    }
}
export class Resolution {
    constructor(readonly stateIdx: number, readonly symbolClass: string, readonly production: IProduction) {
    }
    equals(other: Resolution) {
        return (
            other.stateIdx === this.stateIdx
            && other.symbolClass === this.symbolClass
            && other.production === this.production
        );
    }
}

function closure(productions: Productions, state: State) {
    let change: boolean;
    do {
        change = false;
        for (let pos of state.productionPositions) {
            for (let prod of productions.getProductionsFor(pos.nextInput())) {
                const newProdPos = new ProductionPosition(prod, 0);
                if (state.addProductionPosition(newProdPos)) {
                    change = true;
                }
            }
        }
    } while (change);
    return state.sort();
}
function goto(productions: Productions, state: State, symbolClass: string) {
    const nextProductions: ProductionPosition[] = [];
    for (let pos of state.productionPositions) {
        if (pos.nextInput() === symbolClass) {
            nextProductions.push(pos.advance());
        }
    }
    return closure(productions, new State(nextProductions));
}

function addIfNotPresent(arr: { equals: (other) => boolean }[], obj: { equals: (other) => boolean }): [boolean, number] {
    for (let idx in arr) {
        if (arr[idx].equals(obj)) {
            return [false, Number(idx)];
        }
    }
    const idx = arr.push(obj) - 1;
    return [true, idx];
}
export function calcDfa(productions: Productions): [State[], Transition[], Resolution[]] {
    const states: State[] = [];
    const transitions: Transition[] = [];

    { //States and transitions
        const startProductions: IProduction[] = [];
        for (let startProd of startSymbols) {
            startProductions.push(...productions.getProductionsFor(startProd));
        }
        const selectZeros = startProductions.map((p) => new ProductionPosition(p, 0));
        states.push(closure(productions, new State(selectZeros)));
        let change: boolean;
        do {
            change = false;
            for (let stateIdx in states) {
                const state = states[stateIdx];
                for (let prodPos of state.productionPositions.filter((pos) => !pos.isAtEnd())) {
                    const symbolClass = prodPos.nextInput();
                    const nextState = goto(productions, state, symbolClass);
                    const [stateAdded, nextStateIdx] = addIfNotPresent(states, nextState);
                    const transition = new Transition(Number(stateIdx), nextStateIdx, symbolClass);
                    const transitionAdded = addIfNotPresent(transitions, transition)[0];
                    if (stateAdded || transitionAdded) {
                        change = true;
                    }
                }
            }
        } while (change);
    }

    const resolutions: Resolution[] = [];
    { //Resolutions
        for (let stateIdx in states) {
            const state = states[stateIdx];
            const endPositions = state.productionPositions.filter((p) => p.isAtEnd());
            for (let pos of endPositions) {
                for (let symbolClass of productions.follows(pos.production.result)) {
                    const resolution = new Resolution(Number(stateIdx), symbolClass, pos.production);
                    addIfNotPresent(resolutions, resolution);
                }
            }
        }
    }
    return [states, transitions, resolutions];
}

// //Debug info
// function replacer(k, v) {
// 	if (typeof v === 'function') {
// 		return Symbols.getSymbolName(v);
// 	}
// 	return v;
// }
// console.log(JSON.stringify(states, replacer));
// console.log(JSON.stringify(transitions, replacer));
// console.log(JSON.stringify(resolutions, replacer));
