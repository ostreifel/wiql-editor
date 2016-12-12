import { IParseResults } from "../compiler/wiqlParser";

export interface IErrorChecker {
    check(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[];
}
