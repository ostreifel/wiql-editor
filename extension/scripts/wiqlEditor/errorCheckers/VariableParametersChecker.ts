import * as Symbols from "../compiler/symbols";
import { IErrorChecker } from "./IErrorChecker";
import { IParseResults } from "../compiler/parser";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import { toDecoration, toStringDecoration } from "./errorDecorations";
import { projectsVal } from "../../cachedData/projects";

export class VariableParametersChecker implements IErrorChecker {
    private async checkCurrentIteration(variable: Symbols.VariableExpression): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const name = variable.name.text;
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        if (!variable.args) {
            return errors;
        }
        if (variable.args.args) {
            errors.push(toDecoration(variable.args, `${name} only takes 1 argument`));
        }
        if (!(variable.args.value instanceof Symbols.String)) {
            errors.push(toDecoration(variable.args.value, `Team must be a string`));
            return errors;
        }
        const teamMatch = variable.args.value.text.match(/['"]\[(.*)\]\\(.*)( <.*>)?['"]/);
        if (!teamMatch) {
            errors.push(toDecoration(variable.args.value, "Team must be of format '[project]\\team'"));
            return errors;
        }
        const [, project, team] = teamMatch;
        const projects = (await projectsVal.getValue()).map(({name}) => name);
        if (projects.indexOf(project) < 0) {
            errors.push(toStringDecoration(
                `Project does not exist - expecting one of\n\n ${projects.join(", ")}`,
                variable.args.value,
                2,
                project.length,
            ));
        }

        return errors;
    }
    private async checkToday(variable: Symbols.VariableExpression): Promise<monaco.editor.IModelDeltaDecoration[]> {
        if (variable.args) {
            return [toDecoration(variable.args, "@Today does not accept arguments")];
        }
        return [];
    }
    private async checkDefault(variable: Symbols.VariableExpression): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        const name = variable.name.text;
        if (variable.args) {
            errors.push(toDecoration(variable.args, `${name} does not accept arguments`));
        }
        if (variable.operator && variable.num) {
            errors.push(toDecoration([variable.operator, variable.num], `${name} does not accept an offset`));
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
