import {WorkItemField} from 'TFS/WorkItemTracking/Contracts';

export const getCompletionProvider: (fields: WorkItemField[]) => monaco.languages.CompletionItemProvider = (fields) => {
	return {
		provideCompletionItems: (model, position, token) => {
			const val = model.getValueInRange({
				startLineNumber: 1,
				startColumn: 1,
				endLineNumber: position.lineNumber,
				endColumn: position.column,
			});
			if (val.match(/\s*/)) {
				return [
					{
						label: 'SELECT',
						kind: monaco.languages.CompletionItemKind.Keyword
					}
				];
			}
			return null;
		}
	}
};