import { IParseResults } from '../wiqlParser';

export interface IErrorChecker {
    check(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[];
}
