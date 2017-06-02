import { IErrorChecker } from "./IErrorChecker";
import { IParseResults } from "../compiler/wiqlParser";
import { toDecoration } from "./errorDecorations";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import * as Symbols from "../compiler/wiqlSymbols";
import * as Q from "q";

type Prefix = null | "Source" | "Target";
export class PrefixChecker implements IErrorChecker {
    private checkCondition(condition: Symbols.LinkCondition,
                           errors: monaco.editor.IModelDeltaDecoration[],
                           expectedPrefix: Prefix, isTop: boolean): Prefix {
        if (condition.prefix) {
            if (expectedPrefix === "Source" && !(condition.prefix instanceof Symbols.SourcePrefix)) {
                errors.push(toDecoration(condition.prefix, "Expected Source prefix"));
            } else if (expectedPrefix === "Target" && !(condition.prefix instanceof Symbols.TargetPrefix)) {
                errors.push(toDecoration(condition.prefix, "Expected target prefix"));
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
    public check(parseResult: IParseResults): Q.IPromise<monaco.editor.IModelDeltaDecoration[]> {
        const linksKeyword = symbolsOfType(parseResult, Symbols.WorkItemLinks);
        if (linksKeyword.length === 0) {
            return Q([]);
        }
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        for (const cond of <Symbols.LinkCondition[]>symbolsOfType(parseResult, Symbols.LinkCondition)) {
            if (cond.field) {
                if (cond.field.identifier.text.toLocaleLowerCase() === "link type") {
                    errors.push(toDecoration(cond.field, "Use reference name for link type"));
                } else if (cond.field.identifier.text.toLocaleLowerCase() === "system.links.linktype") {
                    if (cond.prefix) {
                        errors.push(toDecoration(cond.prefix, "Link type cannot be prefixed"));
                    }
                } else if (!cond.prefix) {
                    errors.push(toDecoration(cond.field, "Fields must be prefixed in link queries"));
                }
            }
        }
        if ((parseResult instanceof Symbols.OneHopSelect || parseResult instanceof Symbols.RecursiveSelect)
            && parseResult.whereExp) {
            this.checkExpression(parseResult.whereExp, errors);
        }
        return Q(errors);
    }
}
