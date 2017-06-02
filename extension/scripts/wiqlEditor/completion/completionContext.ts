import { ParseError, IParseResults, parse, ParseMode } from "../compiler/parser";
import { getField } from "../../cachedData/fields";
import * as Symbols from "../compiler/symbols";
import { getFieldComparisonLookup } from "../errorCheckers/TypeErrorChecker";
import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";

/**
 * Common values that would otherwise need to be repeatedly recalcualted while providing completion tokens
 */
export interface ICompletionContext {
    readonly parseNext: ParseError;
    readonly fields: WorkItemField[];
    /** Token before cursor */
    readonly prevToken: Symbols.Symbol;
    /** 2 Tokens (inclusive) before cursor */
    readonly prevToken2: Symbols.Symbol;
    readonly fieldRefName: string;
    readonly fieldType: FieldType | null;
    readonly isInCondition: boolean;
    readonly isFieldAllowed: boolean;
    readonly getAssumedParse: () => IParseResults;
}


export const conditionSymbols = [
    Symbols.Equals,
    Symbols.NotEquals,
    Symbols.LessThan,
    Symbols.LessOrEq,
    Symbols.GreaterThan,
    Symbols.GreaterOrEq,
    Symbols.Like,
    Symbols.Under,
    Symbols.Contains,
    Symbols.Ever,
    Symbols.In
];

/**
 * Whether the given parseState is parsing a conditional token.
 * Ideally the compilier would be able to tell us which productions it was currently parsing - this is just a workaround.
 * @param symbol
 */
function isInConditionParse(parseNext: ParseError) {
    for (const symbol of parseNext.parsedTokens) {
        for (const conditionSym of conditionSymbols) {
            if (symbol instanceof conditionSym) {
                return true;
            }
        }
    }
    return false;
}
function getFieldSymbolRefName(parseNext: ParseError): string {
    for (const symbol of parseNext.parsedTokens) {
        if (symbol instanceof Symbols.Field) {
            return symbol.identifier.text.toLocaleLowerCase();
        }
    }
    return "";
}

export function createContext(model: monaco.editor.IReadOnlyModel, parseNext: ParseError, fields: WorkItemField[]): ICompletionContext {
    const parsedCount = parseNext.parsedTokens.length;
    const prevToken = parseNext.parsedTokens[parsedCount - 1];

    const prevToken2 = parseNext.parsedTokens[parsedCount - 2];
    const fieldRefName = getFieldSymbolRefName(parseNext);
    const fieldInstance = getField(fieldRefName, fields) || null;
    const fieldType = fieldInstance && fieldInstance.type;
    const isInCondition = isInConditionParse(parseNext);
    const isFieldAllowed = !fieldInstance || !isInCondition || getFieldComparisonLookup(fields)[fieldRefName].field.length > 0;

    let assumedParse: IParseResults | null = null;
    function getAssumedParse() {
        if (!assumedParse) {
            assumedParse = parse(model.getLinesContent(), ParseMode.AssumeString);
        }
        return assumedParse;
    }

    return {
        parseNext,
        fields,
        prevToken2,
        prevToken,
        fieldRefName,
        fieldType,
        isInCondition,
        isFieldAllowed,
        getAssumedParse
    };
}
