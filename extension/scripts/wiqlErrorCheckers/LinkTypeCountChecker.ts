import { IErrorChecker } from "./IErrorChecker";
import { IParseResults } from "../compiler/wiqlParser";
import { toDecoration, symbolsOfType } from "./errorCheckUtils";
import * as Symbols from "../compiler/wiqlSymbols";

export class LinkTypeCountChecker implements IErrorChecker {
    public check(parseResult: IParseResults): monaco.editor.IModelDeltaDecoration[] {
        const errors: monaco.editor.IModelDeltaDecoration[] = [];
        if (parseResult instanceof Symbols.RecursiveSelect) {
            const linkConditions = (<Symbols.LinkCondition[]>symbolsOfType(parseResult, Symbols.LinkCondition)).filter(c =>
                c.field && (
                    c.field.identifier.text.toLocaleLowerCase() === "link type" ||
                    c.field.identifier.text.toLocaleLowerCase() === "system.links.linktype"
                )
            );
            if (linkConditions.length === 0) {
                const symbols: Symbols.Symbol[] = [];
                if (parseResult.recursive) {
                    symbols.push(parseResult.recursive);
                }
                if (parseResult.matchingChildren) {
                    symbols.push(parseResult.matchingChildren);
                }
                errors.push(toDecoration(symbols, "Tree query must contain at least 1 link type"));
            } else if (linkConditions.length > 1) {
                for (let linkCondition of linkConditions.slice(1)) {
                    errors.push(toDecoration(linkCondition, "Too many link types in tree query"));
                }
            }
            for (let linkCondition of linkConditions) {
                if (linkCondition.conditionalOperator) {
                    if (!(linkCondition.conditionalOperator.conditionToken instanceof Symbols.Equals)) {
                        errors.push(toDecoration(linkCondition.conditionalOperator, "Only equals is valid for link type in tree queries"));
                    }
                } else {
                    errors.push(toDecoration(linkCondition, "Link type must be checked against a single value"));
                }
            }
        }
        return errors;
    }
}