import { projectsVal } from "../../cachedData/projects";
import { IParseResults } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import { decorationFromString, decorationFromSym } from "./errorDecorations";
import { IErrorChecker } from "./IErrorChecker";

export class VariableParametersChecker implements IErrorChecker {
    private async checkCurrentIteration(variable: Symbols.VariableExpression): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const name = variable.name.text;
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        if (!variable.args) {
            return errors;
        }
        if (variable.args.args) {
            errors.push(decorationFromSym(`${name} only takes 1 argument`, variable.args));
        }
        if (!(variable.args.value instanceof Symbols.String)) {
            errors.push(decorationFromSym(`Team must be a string`, variable.args.value));
            return errors;
        }
        const teamMatch = variable.args.value.text.match(/['"]\[(.*)\]\\(.*)( <.*>)?['"]/);
        if (!teamMatch) {
            errors.push(decorationFromSym("Team must be of format '[project]\\team'", variable.args.value));
            return errors;
        }
        const [, project] = teamMatch;
        const projects = (await projectsVal.getValue()).map(({name: projName}) => projName);
        const lower = (s: string) => s.toLocaleLowerCase();
        if (projects.map(lower).indexOf(lower(project)) < 0) {
            errors.push(decorationFromString(
                `Project does not exist - expecting one of\n\n ${projects.join(", ")}`,
                variable.args.value,
                1,
                project.length + 2,
            ));
        }

        return errors;
    }
    private async checkToday(variable: Symbols.VariableExpression): Promise<monaco.editor.IModelDeltaDecoration[]> {
        if (variable.args) {
            return [decorationFromSym("@Today does not accept arguments", variable.args)];
        }
        return [];
    }
    private async checkDefault(variable: Symbols.VariableExpression): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        const name = variable.name.text;
        if (variable.args) {
            errors.push(decorationFromSym(`${name} does not accept arguments`, variable.args));
        }
        if (variable.operator && variable.num) {
            errors.push(decorationFromSym(`${name} does not accept an offset`, [variable.operator, variable.num]));
        }
        return errors;
    }
    private checkVariable(variable: Symbols.VariableExpression): Promise<monaco.editor.IModelDeltaDecoration[]> {
        switch (variable.name.text.toLocaleLowerCase()) {
            case "@currentiteration":
                return this.checkCurrentIteration(variable);
            case "@today":
                return this.checkToday(variable);
            default:
                return this.checkDefault(variable);
        }
    }
    public async check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]> {
        // TODO check parameters;
        const variables = symbolsOfType<Symbols.VariableExpression>(parseResult, Symbols.VariableExpression);
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        for (const variable of variables) {
            errors.push(... await this.checkVariable(variable));
        }
        return errors;
    }
}
