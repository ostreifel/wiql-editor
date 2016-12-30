import { IErrorChecker } from "./IErrorChecker";
import { SyntaxErrorChecker } from "./SyntaxErrorChecker";
import { NameErrorChecker } from "./NameErrorChecker";
import { TypeErrorChecker } from "./TypeErrorChecker";
import { LinkTypeCountChecker } from "./LinkTypeCountChecker";
import { PrefixChecker } from "./PrefixChecker";
import { IParseResults} from "../compiler/wiqlParser";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";


export class ErrorChecker implements IErrorChecker {
    private readonly errorCheckers: IErrorChecker[];
    constructor(fields: WorkItemField[]) {
        this.errorCheckers = [
            new SyntaxErrorChecker(),
            new NameErrorChecker(fields),
            new TypeErrorChecker(fields),
            new PrefixChecker(),
            new LinkTypeCountChecker()
        ];
    }
    public check(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[] {
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        for (let checker of this.errorCheckers) {
            errors.push(...checker.check(parseResult));
        }
        return errors;
    }
};
