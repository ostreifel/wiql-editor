import { IParseResults } from "../compiler/parser";
import * as Q from "q";

export interface IErrorChecker {
    check(parseResult: IParseResults): Q.IPromise<monaco.editor.IModelDeltaDecoration[]>;
}
