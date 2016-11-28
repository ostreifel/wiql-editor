import {WorkItemField} from 'TFS/WorkItemTracking/Contracts';
import {tokenize} from './wiqlTokenizer';
import * as Symbols from './wiqlSymbols';
import {parse} from './wiqlParser';

export const getCompletionProvider: (fields: WorkItemField[]) => monaco.languages.CompletionItemProvider = (fields) => {
	const fieldRefNames = fields.map((f) => { return { 
		label: f.referenceName, 
		kind: monaco.languages.CompletionItemKind.Variable
	}});
	return {
		provideCompletionItems: (model, position, token) => {
			const lines = model.getLinesContent().slice(0, position.lineNumber);
			if (lines.length > 0 ) {
				lines[lines.length - 1] = lines[lines.length - 1].substr(0, position.column);
			}
			const parseResult = parse(lines);
			console.log(parseResult);
			return [];
		}
	}
};
