import { IErrorChecker } from "./IErrorChecker";
import { SyntaxErrorChecker } from "./SyntaxErrorChecker";
import { NameErrorChecker } from "./NameErrorChecker";
import { TypeErrorChecker } from "./TypeErrorChecker";
import { LinkTypeCountChecker } from "./LinkTypeCountChecker";
import { AllowedValuesChecker } from "./AllowedValuesChecker";
import { PrefixChecker } from "./PrefixChecker";
import { IParseResults} from "../compiler/parser";
import { iterationStrings, areaStrings } from "../../cachedData/nodes";
import { allTags } from "../../cachedData/tags";
import { VariableParametersChecker } from "./VariableParametersChecker";

export class ErrorChecker implements IErrorChecker {
    private readonly errorCheckers: IErrorChecker[];
    constructor() {
        this.errorCheckers = [
            new SyntaxErrorChecker(),
            new NameErrorChecker(),
            new TypeErrorChecker(),
            new PrefixChecker(),
            new LinkTypeCountChecker(),
            new AllowedValuesChecker("System.IterationPath", "Iteration Path", iterationStrings),
            new AllowedValuesChecker("System.AreaPath", "Area Path", areaStrings),
            new AllowedValuesChecker("System.Tags", "Tags", allTags),
            new VariableParametersChecker(),
        ];
    }
    public async check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const promises = this.errorCheckers.map(checker => checker.check(parseResult));
        const allErrorArrs = await Promise.all(promises);
        const allErrors: monaco.editor.IModelDeltaDecoration[] = [];
        for (const errors of allErrorArrs) {
            allErrors.push(...errors);
        }
        return allErrors;
    }
};
