import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";
import { symbolsOfType } from "./wiqlErrorCheckers/errorCheckUtils";
import { parse } from "./compiler/wiqlParser";
import * as Symbols from "./compiler/wiqlSymbols";
import { definedVariables } from "./wiqlDefinition";

function filterByPosition(tokens: Symbols.Token[], position: monaco.Position) {
    return tokens.filter(token =>
        token.line === position.lineNumber - 1 &&
        token.startColumn <= position.column &&
        token.endColumn >= position.column
    );
}

export function getHoverProvider(fields: WorkItemField[]): monaco.languages.HoverProvider {
    return {
        provideHover: (model, position, token) => {
            const lines = model.getLinesContent();

            const parseResult = parse(lines);
            const ids = symbolsOfType<Symbols.Identifier>(parseResult, Symbols.Identifier);
            const [id] = filterByPosition(ids, position);

            const hovers: monaco.MarkedString[] = [];
            let range: monaco.IRange = null as any;
            if (id) {
                const matchedFields = fields.filter(f =>
                    f.name.toLocaleLowerCase() === id.text.toLocaleLowerCase() ||
                    f.referenceName.toLocaleLowerCase() === id.text.toLocaleLowerCase()
                );
                if (matchedFields.length > 0) {
                    hovers.push(FieldType[matchedFields[0].type]);
                    range = new monaco.Range(id.line + 1, id.startColumn + 1, id.line + 1, id.endColumn + 1);
                }
            } else {
                const vars = symbolsOfType<Symbols.Identifier>(parseResult, Symbols.Variable);
                const [variable] = filterByPosition(vars, position);
                if (variable) {
                    const matchedVariable = variable.text.toLocaleLowerCase() in definedVariables;
                    if (matchedVariable) {
                        hovers.push(FieldType[definedVariables[variable.text.toLocaleLowerCase()]]);
                        range = new monaco.Range(variable.line + 1, variable.startColumn + 1, variable.line + 1, variable.endColumn + 1);
                    }
                }
            }

            return { contents: hovers, range };
        }
    };
}
