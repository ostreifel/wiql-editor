import {WorkItemField} from 'TFS/WorkItemTracking/Contracts';
import {tokenize} from './wiqlTokenizer';

export const getCompletionProvider: (fields: WorkItemField[]) => monaco.languages.CompletionItemProvider = (fields) => {
	const fieldRefNames = fields.map((f) => { return { 
		label: f.referenceName, 
		kind: monaco.languages.CompletionItemKind.Variable
	}});
	return {
		provideCompletionItems: (model, position, token) => {
			return null;
			// const val = model.getValueInRange({
			// 	startLineNumber: 1,
			// 	startColumn: 1,
			// 	endLineNumber: position.lineNumber,
			// 	endColumn: position.column,
			// });
			// const lines = model.getLinesContent().slice(0, position.lineNumber - 1);
			// lines[lines.length -1].substr(0, position.column - 1)
			
			// const tokens = tokenize(lines);
			// if (tokens.length == 0) {
			// 	return [
			// 		{
			// 			label: 'SELECT',
			// 			kind: monaco.languages.CompletionItemKind.Keyword
			// 		}
			// 	];
			// }
			// const lastToken = tokens[tokens.length - 1];
			// if (tokens[0] === 'select' 
			// 	&& tokens.indexOf('from') < 0) {
			// 	if (lastToken === ',' || lastToken === '[' || tokens.length === 1) {
			// 		return fieldRefNames;
			// 	} else {
			// 		return [{
			// 			label: 'FROM workitems',
			// 			kind: monaco.languages.CompletionItemKind.Snippet
			// 		},
			// 		{
			// 			label: ',',
			// 			kind: monaco.languages.CompletionItemKind.Keyword
			// 		}]
			// 	}
			// }
			// if (tokens[0] === 'select' && lastToken === 'workitems') {
			// 	return [
			// 		{label:'WHERE', kind: monaco.languages.CompletionItemKind.Keyword},
			// 		{label:'ORDER BY', kind: monaco.languages.CompletionItemKind.Keyword},
			// 		{label:'ASOF', kind: monaco.languages.CompletionItemKind.Keyword},
			// 	]
			// }
			// return fieldRefNames;
		}
	}
};