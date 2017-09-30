import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";
import { definedVariables } from "../wiqlDefinition";
import { FieldLookup } from "../../cachedData/fields";

export function getStandardFieldSuggestions(fields: FieldLookup, type: FieldType | null): monaco.languages.CompletionItem[] {
    const matchingFields = fields.values.filter(f => type === null || type === f.type);
    return matchingFields.map(f => {
        return {
            label: f.referenceName,
            kind: monaco.languages.CompletionItemKind.Variable
        } as monaco.languages.CompletionItem;
    }).concat(matchingFields.map(f => {
        return {
            label: f.name,
            kind: monaco.languages.CompletionItemKind.Variable
        } as monaco.languages.CompletionItem;
    }));
}
export function getStandardVariableSuggestions(type: FieldType | null) {
    const suggestions: monaco.languages.CompletionItem[] = [];
    for (const variable in definedVariables) {
        if (type === null || definedVariables[variable] === type) {
            suggestions.push({
                label: variable,
                kind: monaco.languages.CompletionItemKind.Variable
            } as monaco.languages.CompletionItem);
        }
    }
    return suggestions;
}
