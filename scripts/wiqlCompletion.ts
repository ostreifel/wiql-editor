import { WorkItemField } from 'TFS/WorkItemTracking/Contracts';
import { tokenize, opMap, symbolMap } from './wiqlTokenizer';
import * as Symbols from './wiqlSymbols';
import { parse, ParseError } from './wiqlParser';
import { validVariableNames } from './wiqlDefinition';

// These symbols are buggy when suggested
// brackets are not paired, rbrackets and commas suggested when its a syntax error to do so 
const doNotSuggest = ['(', ')', ',', '[', ']'];

const symbolSuggestionMap: { [symbolName: string]: monaco.languages.CompletionItem } = {};
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
	const fieldLabels = fields.filter((f) => f.name.indexOf(' ') < 0)
		.map((f) => f.name)
		.concat(fields.map((f) => f.referenceName))
	const fieldSuggestions = fieldLabels.map((label) => {
		return {
			label: label,
			kind: monaco.languages.CompletionItemKind.Variable
		};
	});
	const variableSuggestions = validVariableNames.map((v) => {
		return {
			label: v,
			kind: monaco.languages.CompletionItemKind.Variable
		};
	})
	return {
		provideCompletionItems: (model, position, token) => {
			const lines = model.getLinesContent().slice(0, position.lineNumber);
			if (lines.length > 0) {
				lines[lines.length - 1] = lines[lines.length - 1].substr(0, position.column - 1);
			}
			const parseResult = parse(lines);
			//if asof has value don't suggest, otherwise suggest thinks its in an expression
			if (parseResult instanceof Symbols.FlatSelect && parseResult.asOf) {
				return [];
			}
			const parseNext = parse(lines, true);
			console.log(parseNext);
			let prevToken: Symbols.Symbol;
			if (!(parseNext instanceof ParseError) || parseNext.remainingTokens > 2) {
				// valid query, can't suggest
				return [];
			} else if ((prevToken = parseNext.parsedTokens[parseNext.parsedTokens.length - 1]) instanceof Symbols.Identifier
				&& position.column - 1 === prevToken.endColumn) {
				// In process of typing field name
				// (parser just consumes this becuase it doesn't know which fields are valid)
				return fieldSuggestions;
			} else if ((prevToken = parseNext.parsedTokens[parseNext.parsedTokens.length - 1]) instanceof Symbols.Variable
				&& position.column - 1 === prevToken.endColumn) {
				return variableSuggestions;
			} else {
				const suggestions: monaco.languages.CompletionItem[] = [];
				for (let token of parseNext.expectedTokens) {
					if (symbolSuggestionMap[token]) {
						suggestions.push(symbolSuggestionMap[token]);
					}
				}
				if (parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Identifier)) >= 0) {
					suggestions.push(...fieldSuggestions);
				}
				if (parseNext.expectedTokens.indexOf(Symbols.getSymbolName(Symbols.Variable)) >= 0) {
					suggestions.push(...variableSuggestions);
				}
				return suggestions;
			}
		}
	}
};
