import { IParseResults } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import { decorationFromSym } from "./errorDecorations";
import { IErrorChecker } from "./IErrorChecker";

type Prefix = null | "Source" | "Target";
export class PrefixChecker implements IErrorChecker {
    private checkCondition(condition: Symbols.LinkCondition,
                           errors: monaco.editor.IModelDeltaDecoration[],
                           expectedPrefix: Prefix, isTop: boolean): Prefix {
        if (condition.prefix) {
            if (expectedPrefix === "Source" && !(condition.prefix instanceof Symbols.SourcePrefix)) {
                errors.push(decorationFromSym("Expected Source prefix", condition.prefix));
            } else if (expectedPrefix === "Target" && !(condition.prefix instanceof Symbols.TargetPrefix)) {
                errors.push(decorationFromSym("Expected target prefix", condition.prefix));
            } else if (!expectedPrefix) {
                expectedPrefix = condition.prefix instanceof Symbols.SourcePrefix ? "Source" : "Target";
            }
        }
        if (condition.expression) {
            expectedPrefix = this.checkExpression(condition.expression, errors, expectedPrefix, isTop);
        }
        return expectedPrefix;
    }
    private checkExpression(expression: Symbols.LinkExpression,
                            errors: monaco.editor.IModelDeltaDecoration[],
                            expectedPrefix: Prefix = null, isTop = true): Prefix {

        if (expression.condition) {
            expectedPrefix = this.checkCondition(expression.condition,
                                                 errors,
                                                 expectedPrefix,
                                                 isTop && !expression.condition);
        }

        if (expression.expression) {
            expectedPrefix = this.checkExpression(expression.expression,
                                                  errors,
                                                  isTop ? null : expectedPrefix,
                                                  isTop);
        }
        return expectedPrefix;
    }
    public async check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const linksKeyword = symbolsOfType(parseResult, Symbols.WorkItemLinks);
        if (linksKeyword.length === 0) {
            return [];
        }
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        for (const cond of <Symbols.LinkCondition[]> symbolsOfType(parseResult, Symbols.LinkCondition)) {
            if (cond.field) {
                if (cond.field.identifier.text.toLocaleLowerCase() === "link type") {
                    errors.push(decorationFromSym("Use reference name for link type", cond.field));
                } else if (cond.field.identifier.text.toLocaleLowerCase() === "system.links.linktype") {
                    if (cond.prefix) {
                        errors.push(decorationFromSym("Link type cannot be prefixed", cond.prefix));
                    }
                } else if (!cond.prefix) {
                    errors.push(decorationFromSym("Fields must be prefixed in link queries", cond.field));
                }
            }
        }
        if ((parseResult instanceof Symbols.OneHopSelect || parseResult instanceof Symbols.RecursiveSelect)
            && parseResult.whereExp) {
            this.checkExpression(parseResult.whereExp, errors);
        }
        return errors;
    }
}
