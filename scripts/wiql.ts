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
			[/[a-z_]\w*/, {cases: {'@keywords': 'keyword', '@default': 'error'}}],
			{ include: '@whitespace' },	
		],
		whitespace: [
			[/[ \t\r\n]+/, 'white']
		]
	}
};
