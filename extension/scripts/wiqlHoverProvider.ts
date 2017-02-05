import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";
import { symbolsOfType } from "./wiqlErrorCheckers/errorCheckUtils";
import { parse } from "./compiler/wiqlParser";
import * as Symbols from "./compiler/wiqlSymbols";

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
            const idsAtPos = filterByPosition(ids, position);

            const hovers: monaco.MarkedString[] = [];
            let range: monaco.IRange = null as any;
            if (idsAtPos.length > 0) {
                const id = idsAtPos[0];
                const matchedFields = fields.filter(f =>
                    f.name.toLocaleLowerCase() === id.text.toLocaleLowerCase() ||
                    f.referenceName.toLocaleLowerCase() === id.text.toLocaleLowerCase()
                );
                if (matchedFields.length > 0) {
                    hovers.push(FieldType[matchedFields[0].type]);
                    range = new monaco.Range(id.line + 1, id.startColumn, id.line + 1, id.endColumn + 1);
                }
            }

            return {contents: hovers, range};
        }
    };
}
