export const def: monaco.languages.ILanguageExtensionPoint = {
	id: 'wiql',
	extensions: [ '.wiql' ],
	aliases: [ 'WIQL' ],
};
export const conf: monaco.languages.LanguageConfiguration = {
	brackets: [['[',']'],['(',')']]
};

export const language = <monaco.languages.IMonarchLanguage>{
	ignoreCase: true,		
    tokenPostfix: '.wiql',
    
	keywords: ['select', 'from', 'where', 'order', 'by', 'asc', 'desc', 'asof', 'not', 'ever','in', 'like', 'under'],
	tokenizer: {
		root: [
			[/[a-z_]\w*/, {cases: {'@keywords': 'keyword', '@default': 'identifier'}}],
			[/[ \t\r\n]+/, 'white'],
			{ include: '@strings' }
		],
		strings: [
			[/'/, { token: 'string.quote', bracket: '@open', next: '@string1' }],
			[/"/, { token: 'string.quote', bracket: '@open', next: '@string2' }]
		],
		string1: [
			[/[^']+/, 'string'],
			[/''/, 'string'],
			[/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
		],
		string2: [
			[/[^"]+/, 'string'],
			[/""/, 'string'],
			[/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
		],
		
	}
};
