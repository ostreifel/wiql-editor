import {states, transitions, resolutions} from './wiqlDfa';
import * as Symbols from './wiqlSymbols';
import {IProduction} from './wiqlProductions';
import {tokenize} from './wiqlTokenizer';

export enum Action  {
    Shift,
    Reduce,
    Goto
}
function computeTable() {
    const table: {
        [symbolName: string]: 
        {action: Action.Shift | Action.Goto, state: number} |
        {action: Action.Reduce, production: IProduction}
    }[] = [];
    for (let i = 0; i < states.length; i++) {
        table[i] = {};
    }
    for (let transition of transitions) {
        const symbolName = Symbols.getSymbolName(transition.symbolClass);
        if (Symbols.isTokenClass(transition.symbolClass)) {
            table[transition.from][symbolName] = {action: Action.Shift, state: transition.to};
        } else {
            table[transition.from][symbolName] = {action: Action.Goto, state: transition.to};
        }
    }
    for (let resolution of resolutions) {
        const symbolName = Symbols.getSymbolName(resolution.symbolClass);
        table[resolution.stateIdx][symbolName] = {action: Action.Reduce, production: resolution.production};
    }
    return table;
}

export const table = computeTable();

export interface IParseResults {
    wiqlTree?;
    errorMessage?: string;
    completionTokens?: monaco.languages.CompletionItem[]
}

const tokenKind = monaco.languages.CompletionItemKind;
export function parse(lines: string[]): IParseResults {
    const tokens = tokenize(lines);
    throw new Error('unimplemented');
}