import { IErrorChecker } from './IErrorChecker';
import { SyntaxErrorChecker } from './SyntaxErrorChecker';
import { NameErrorChecker } from './NameErrorChecker';
import { TypeErrorChecker } from './TypeErrorChecker';
import { IParseResults, ParseError, parse } from '../wiqlParser';
import { WorkItemField } from 'TFS/WorkItemTracking/Contracts';
import * as Symbols from '../wiqlSymbols';


export class ErrorChecker implements IErrorChecker {
    private readonly errorCheckers: IErrorChecker[];
    constructor(fields: WorkItemField[]) {
        this.errorCheckers = [
            new SyntaxErrorChecker(),
            new NameErrorChecker(fields),
            new TypeErrorChecker(fields)
        ];
    }
    public check(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[] {
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        for (let checker of this.errorCheckers) {
            errors.push(...checker.check(parseResult));
        }
        return errors;
    }
    public register(editor: monaco.editor.IStandaloneCodeEditor) {
        const model = editor.getModel();
        let oldDecorations: string[] = [];
        editor.onDidChangeModelContent((event) => {
            const lines = model.getLinesContent();
            const parseResult = parse(lines);
            const newDecorations = this.check(parseResult);
            oldDecorations = model.deltaDecorations(oldDecorations, newDecorations);
        });
    }
};
