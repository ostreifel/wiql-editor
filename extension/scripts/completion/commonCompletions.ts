import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";
import { definedVariables } from "../wiqlDefinition";

export function getFieldSuggestions(fields: WorkItemField[], type: FieldType | null): monaco.languages.CompletionItem[] {
    const matchingFields = fields.filter(f => type === null || type === f.type);
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
export function getVariableSuggestions(type: FieldType | null) {
    const suggestions: monaco.languages.CompletionItem[] = [];
    for (let variable in definedVariables) {
        if (type === null || definedVariables[variable] === type) {
            suggestions.push({
                label: variable,
                kind: monaco.languages.CompletionItemKind.Variable
            } as monaco.languages.CompletionItem);
        }
    }
    return suggestions;
}
