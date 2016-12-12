import * as fs from 'fs';
import { State, Transition, Resolution, calcDfa } from './wiqlDfa';
import { IProduction, Productions } from './wiqlProductions';
import { parse } from './ebnfParser';


function computeTable(productions: Productions, states: State[], transitions: Transition[], resolutions: Resolution[]) {
    const table: {
        tokens: {
            [symbolName: string]:
            { action: 'shift', state: number } |
            { action: 'reduce', production: IProduction } |
            undefined
        }
        symbols: {
            [symbolName: string]: number | undefined
        }
    }[] = [];
    for (let i = 0; i < states.length; i++) {
        table[i] = { tokens: {}, symbols: {} };
    }
    for (let transition of transitions) {
        const symbolName = transition.symbolClass;
        if (productions.isTokenClass(transition.symbolClass)) {
            table[transition.from].tokens[symbolName] = { action: 'shift', state: transition.to };
        } else {
            table[transition.from].symbols[symbolName] = transition.to;
        }
    }
    for (let resolution of resolutions) {
        const symbolName = resolution.symbolClass;
        table[resolution.stateIdx].tokens[symbolName] = { action: 'reduce', production: resolution.production };
    }
    for (let acceptSymbol of ['FLATSELECT']) {
        table[0].symbols[acceptSymbol] = -1;
    }
    return table;
}

console.log(process.argv);
const ebnfFile = process.argv[2]; 
const outFile = process.argv[3]; 
if (process.argv.length !== 4) {
    console.log(`Usage buildTable.js <ebnf file> <out file>`);
    process.exit(-1);
}

const ebnfRules = parse(ebnfFile);
const productions = new Productions(ebnfRules);
const [states, transitions, resolutions] = calcDfa(productions);
const table = computeTable(productions, states, transitions,resolutions);

const tableFile = `export const table = ${JSON.stringify(table)}
`;
fs.writeFileSync(outFile, table, {encoding: 'utf-8'});
