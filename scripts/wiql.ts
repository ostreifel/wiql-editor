import IRichLanguageConfiguration = monaco.languages.LanguageConfiguration;
import ILanguage = monaco.languages.IMonarchLanguage;

export const def: monaco.languages.ILanguageExtensionPoint = {
	id: 'wiql',
	extensions: [ '.wiql' ],
	aliases: [ 'WIQL' ],
};
export const conf: IRichLanguageConfiguration = {
	brackets: [['[',']'],['(',')']]
};

export const language: ILanguage = {
    tokenizer: {},
    tokenPostfix: '.wiql'
};
