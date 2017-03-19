import { IErrorChecker } from "./IErrorChecker";
import { SyntaxErrorChecker } from "./SyntaxErrorChecker";
import { NameErrorChecker } from "./NameErrorChecker";
import { TypeErrorChecker } from "./TypeErrorChecker";
import { LinkTypeCountChecker } from "./LinkTypeCountChecker";
import { TreePathChecker } from "./TreePathChecker";
import { PrefixChecker } from "./PrefixChecker";
import { IParseResults} from "../compiler/wiqlParser";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import * as Q from "q";

export class ErrorChecker implements IErrorChecker {
    private readonly errorCheckers: IErrorChecker[];
    constructor(fields: WorkItemField[]) {
        this.errorCheckers = [
            new SyntaxErrorChecker(),
            new NameErrorChecker(fields),
            new TypeErrorChecker(fields),
            new PrefixChecker(),
            new LinkTypeCountChecker(),
            new TreePathChecker()
        ];
    }
    public check(parseResult: IParseResults): Q.IPromise<monaco.editor.IModelDeltaDecoration[]> {
        const promises = this.errorCheckers.map(checker => checker.check(parseResult));
        return Q.all(promises).then(allErrorArrs => {
            const allErrors: monaco.editor.IModelDeltaDecoration[] = [];
            for (let errors of allErrorArrs) {
                allErrors.push(...errors);
            }
            return allErrors;
        });
    }
};
