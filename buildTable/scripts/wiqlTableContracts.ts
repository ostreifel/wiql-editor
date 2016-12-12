export interface IProduction {
    inputCount: number;
    result: string;
}
export interface IParseTable {
    [state: number]: {
        tokens: {
            [symbolName: string]:
            { action: 'shift', state: number } |
            { action: 'reduce', production: IProduction } |
            undefined
        },
        symbols: {
            [symbolName: string]: number | undefined
        }
    };
};
