import * as fs from 'fs';
import { State, Transition, Resolution, calcDfa } from './wiqlDfa';
import { IProduction, Productions } from './wiqlProductions';
import { parse } from './ebnfParser';
import { IParseTable } from './wiqlTableContracts';


function computeTable(productions: Productions, states: State[], transitions: Transition[], resolutions: Resolution[]): IParseTable {
    const table: IParseTable = [];
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
        table[resolution.stateIdx].tokens[symbolName] = { 
            action: 'reduce', 
            production: { 
                result: resolution.production.result, 
                inputCount: resolution.production.inputs.length 
            } 
        };
    }
    for (let acceptSymbol of productions.startSymbols) {
        table[0].symbols[acceptSymbol] = -1;
    }
    return table;
}

const ebnfFile = process.argv[2];
const outFile = process.argv[3];
if (process.argv.length !== 4) {
    console.log(`Usage buildTable.js <ebnf file> <out file>`);
    process.exit(-1);
}

const ebnfRules = parse(ebnfFile);
const productions = new Productions(ebnfRules);
const [states, transitions, resolutions] = calcDfa(productions);
const table = computeTable(productions, states, transitions, resolutions);

const tableFile = `
// Generated file: Do not edit
import { IParseTable } from "./wiqlTableContracts";
export const table: IParseTable = ${JSON.stringify(table)};
`;
fs.writeFileSync(outFile, tableFile, { encoding: 'utf-8' });
process.exit(0);
