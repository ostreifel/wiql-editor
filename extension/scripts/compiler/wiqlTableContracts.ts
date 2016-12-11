export enum Action {
    Shift,
    Reduce,
    Goto,
}
export interface IProduction {
    inputCount: number;
    result: string;
}
export interface IParseTable {
    tokens: {
        [symbolName: string]:
        { action: Action.Shift, state: number } |
        { action: Action.Reduce, production: IProduction } |
        undefined
    },
    symbols: {
        [symbolName: string]: number | undefined
    }
}[];