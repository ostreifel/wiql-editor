import {WorkItemField} from 'TFS/WorkItemTracking/Contracts';
import {tokenize, opMap, symbolMap} from './wiqlTokenizer';
import * as Symbols from './wiqlSymbols';
import {parse, ParseError} from './wiqlParser';

// These symbols are buggy when suggested
const doNotSuggest = ['(', ')', ',']

const symbolSuggestionMap: {[symbolName: string]: monaco.languages.CompletionItem} = {};
for (let map of [opMap, symbolMap]) {
	for (let label in map) {
		if (doNotSuggest.indexOf(label) < 0) {
			const symName = Symbols.getSymbolName(map[label]);
			symbolSuggestionMap[symName] = {
				label: label,
				kind: monaco.languages.CompletionItemKind.Keyword
			};
		}
	}
}
export const getCompletionProvider: (fields: WorkItemField[]) => monaco.languages.CompletionItemProvider = (fields) => {
	const fieldSuggestions = fields.filter((f) => f.name.indexOf(' ') < 0).map((f) => { return {
		label: f.name,
		kind: monaco.languages.CompletionItemKind.Variable
	}}).concat(fields.map((f) => { return { 
		label: f.referenceName, 
		kind: monaco.languages.CompletionItemKind.Variable
	}}));
	return {
		provideCompletionItems: (model, position, token) => {
			const lines = model.getLinesContent().slice(0, position.lineNumber);
			if (lines.length > 0 ) {
				lines[lines.length - 1] = lines[lines.length - 1].substr(0, position.column - 1);
			}
			const parseResult = parse(lines, true);
			console.log(parseResult);
			if (!(parseResult instanceof ParseError) || parseResult.remainingTokens > 2) {
				// valid query, can't suggest
				return [];
			} else {
				const suggestions: monaco.languages.CompletionItem[] = [];
				for (let token of parseResult.expectedTokens) {
					if (symbolSuggestionMap[token]) {
						suggestions.push(symbolSuggestionMap[token]);
					}
				}
				if (parseResult.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Field)) >= 0) {
					suggestions.push(...fieldSuggestions);
				}
				return suggestions;
			}
		}
	}
};
