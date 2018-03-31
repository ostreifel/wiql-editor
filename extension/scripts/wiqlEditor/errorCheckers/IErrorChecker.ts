import { IParseResults } from "../compiler/parser";

export interface IErrorChecker {
    check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]>;
}
