import { IParseResults } from "../compiler/wiqlParser";
import * as Q from "q";

export interface IErrorChecker {
    check(parseResult: IParseResults): Q.IPromise<monaco.editor.IModelDeltaDecoration[]>;
}
