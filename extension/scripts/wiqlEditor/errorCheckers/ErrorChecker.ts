import { areaStrings, iterationStrings } from "../../cachedData/nodes";
import { allTagsVal } from "../../cachedData/tags";
import { IParseResults } from "../compiler/parser";
import { AllowedValuesChecker } from "./AllowedValuesChecker";
import { IErrorChecker } from "./IErrorChecker";
import { LinkTypeCountChecker } from "./LinkTypeCountChecker";
import { NameErrorChecker } from "./NameErrorChecker";
import { PrefixChecker } from "./PrefixChecker";
import { SyntaxErrorChecker } from "./SyntaxErrorChecker";
import { TypeErrorChecker } from "./TypeErrorChecker";
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
            new AllowedValuesChecker("System.Tags", "Tags", allTagsVal),
            new VariableParametersChecker(),
        ];
    }
    public async check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const promises = this.errorCheckers.map((checker) => checker.check(parseResult));
        const allErrorArrs = await Promise.all(promises);
        const allErrors: monaco.editor.IModelDeltaDecoration[] = [];
        for (const errors of allErrorArrs) {
            allErrors.push(...errors);
        }
        return allErrors;
    }
}
