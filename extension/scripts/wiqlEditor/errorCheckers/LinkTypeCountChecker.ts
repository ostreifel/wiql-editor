import { IParseResults } from "../compiler/parser";
import * as Symbols from "../compiler/symbols";
import { symbolsOfType } from "../parseAnalysis/findSymbol";
import { decorationFromSym } from "./errorDecorations";
import { IErrorChecker } from "./IErrorChecker";

export class LinkTypeCountChecker implements IErrorChecker {
    public async check(parseResult: IParseResults): Promise<monaco.editor.IModelDeltaDecoration[]> {
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        if (parseResult instanceof Symbols.RecursiveSelect) {
            const linkConditions = (<Symbols.LinkCondition[]> symbolsOfType(parseResult, Symbols.LinkCondition)).filter((c) =>
                c.field && (
                    c.field.identifier.text.toLocaleLowerCase() === "link type" ||
                    c.field.identifier.text.toLocaleLowerCase() === "system.links.linktype"
                ),
            );
            if (linkConditions.length === 0) {
                const symbols: Symbols.Symbol[] = [];
                if (parseResult.recursive) {
                    symbols.push(parseResult.recursive);
                }
                if (parseResult.matchingChildren) {
                    symbols.push(parseResult.matchingChildren);
                }
                if (symbols.length > 0) {
                    errors.push(decorationFromSym("Tree query must contain at least 1 link type", symbols));
                }
            } else if (linkConditions.length > 1) {
                for (const linkCondition of linkConditions.slice(1)) {
                    errors.push(decorationFromSym("Too many link types in tree query", linkCondition));
                }
            }
            for (const linkCondition of linkConditions) {
                if (linkCondition.conditionalOperator) {
                    if (
                        !(linkCondition.conditionalOperator instanceof Symbols.ConditionalOperator) ||
                        !(linkCondition.conditionalOperator.conditionToken instanceof Symbols.Equals)
                    ) {
                        errors.push(decorationFromSym("Only equals is valid for link type in tree queries", linkCondition.conditionalOperator));
                    }
                } else {
                    errors.push(decorationFromSym("Link type must be checked against a single value", linkCondition));
                }
            }
        }
        return errors;
    }
}
