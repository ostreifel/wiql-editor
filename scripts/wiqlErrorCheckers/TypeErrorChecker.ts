import { IErrorChecker } from './IErrorChecker';
import { IParseResults, parse } from '../wiqlParser';
import { WorkItemField } from 'TFS/WorkItemTracking/Contracts';

export class TypeErrorChecker {
    constructor(fields: WorkItemField[]) {
    }
    public check(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[] {
        throw new Error('unimplemented');
        // const errors: monaco.editor.IModelDeltaDecoration[] = [];
        // const allConditions = symbolsOfType<Symbols.ConditionalExpression>(parseResult, Symbols.ConditionalExpression);
        // const fieldConditions = allConditions.filter((c) => c.field !== undefined);
        // for (let comparison of fieldConditions) {
        //     // comparison.
        // }
        // return errors;
    }
}
