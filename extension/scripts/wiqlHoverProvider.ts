import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";
import { symbolsOfType } from "./wiqlErrorCheckers/errorCheckUtils";
import { parse } from "./compiler/wiqlParser";
import * as Symbols from "./compiler/wiqlSymbols";
import { definedVariables } from "./wiqlDefinition";
import { allProjectWits } from "./cachedData/workItemTypes";
import { getField, fields } from "./cachedData/fields";

function filterByPosition(tokens: Symbols.Token[], position: monaco.Position) {
    return tokens.filter(token =>
        token.line === position.lineNumber - 1 &&
        token.startColumn <= position.column &&
        token.endColumn >= position.column
    );
}

export function getHoverProvider(): monaco.languages.HoverProvider {
    return {
        provideHover: (model, position, token) => {
            const lines = model.getLinesContent();

            const parseResult = parse(lines);
            const ids = symbolsOfType<Symbols.Identifier>(parseResult, Symbols.Identifier);
            const [id] = filterByPosition(ids, position);

            const hovers: monaco.MarkedString[] = [];
            let range: monaco.IRange = null as any;
            if (id) {
                return fields.getValue().then(fields => {
                    const matchedField = getField(id.text, fields);
                    if (matchedField) {
                        hovers.push(FieldType[matchedField.type]);
                        range = new monaco.Range(id.line + 1, id.startColumn + 1, id.line + 1, id.endColumn + 1);
                        // Also include description -- extensions can only get this from the work item types
                        return allProjectWits.getValue().then(witsByProjs => {
                            const descriptionSet: {[description: string]: void} = {};
                            const descriptions: {[witName: string]: string} = {};
                            for (let { workItemTypes } of witsByProjs) {
                                for (let wit of workItemTypes) {
                                    for (let field of wit.fieldInstances) {
                                        if (field.referenceName === matchedField.referenceName && field.helpText) {
                                            descriptions[wit.name] = field.helpText;
                                            descriptionSet[field.helpText] = void 0;
                                        }
                                    }
                                }
                            }
                            // TODO detect if filtering by wit then use the wit specific description
                            const descriptionArr = Object.keys(descriptionSet);
                            // Don't show the description if it differs by wit
                            if (descriptionArr.length === 1) {
                                hovers.push(descriptionArr[0]);
                            }
                            return { contents: hovers, range };
                        });
                    }
                    return { contents: hovers, range };
                });
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
