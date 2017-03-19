import { IErrorChecker } from "./IErrorChecker";
import { SyntaxErrorChecker } from "./SyntaxErrorChecker";
import { NameErrorChecker } from "./NameErrorChecker";
import { TypeErrorChecker } from "./TypeErrorChecker";
import { LinkTypeCountChecker } from "./LinkTypeCountChecker";
import { AllowedValuesChecker } from "./AllowedValuesChecker";
import { PrefixChecker } from "./PrefixChecker";
import { IParseResults} from "../compiler/wiqlParser";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import * as Q from "q";
import { iterationStrings, areaStrings } from "../cachedData/nodes";
import { tags } from "../cachedData/tags";

export class ErrorChecker implements IErrorChecker {
    private readonly errorCheckers: IErrorChecker[];
    constructor(fields: WorkItemField[]) {
        this.errorCheckers = [
            new SyntaxErrorChecker(),
            new NameErrorChecker(fields),
            new TypeErrorChecker(fields),
            new PrefixChecker(),
            new LinkTypeCountChecker(),
            new AllowedValuesChecker("System.IterationPath", "Iteration Path", iterationStrings),
            new AllowedValuesChecker("System.AreaPath", "Area Path", areaStrings),
            new AllowedValuesChecker("System.Tags", "Tags", tags),
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
