export interface IParseResults {
    wiqlTree?;
    errorMessage?: string;
    completionTokens?: monaco.languages.CompletionItem[]
}

const tokenKind = monaco.languages.CompletionItemKind;
export function parse(tokens: string[]): IParseResults {
    const results = {
        completionTokens: []
    };
    if (tokens.length == 0) {
        return {
            errorMessage: "Expecting query body",
            completionTokens: [{label: 'SELECT', kind: tokenKind.Keyword}]
        }
    }
    if (tokens[0] !== 'select') {
        return {
            errorMessage: 'Query must start with select',
        };
    }
    return results;
}