import { WorkItemField, FieldType } from "TFS/WorkItemTracking/Contracts";
import { symbolsOfType } from "./parseAnalysis/findSymbol";
import { parse } from "./compiler/parser";
import * as Symbols from "./compiler/symbols";
import { definedVariables } from "./wiqlDefinition";
import { allProjectWits, getWitsByProjects } from "../cachedData/workItemTypes";
import { getField, fields } from "../cachedData/fields";
import * as Q from "q";
import { getFilters } from "./parseAnalysis/whereClauses";

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
                return Q.all([fields.getValue(), getFilters(parseResult)]).then(([fields, filters]) => {
                    const matchedField = getField(id.text, fields);
                    if (matchedField) {
                        hovers.push(FieldType[matchedField.type]);
                        range = new monaco.Range(id.line + 1, id.startColumn + 1, id.line + 1, id.endColumn + 1);
                        // Also include description -- extensions can only get this from the work item types
                        return getWitsByProjects(filters.projects, filters.workItemTypes).then(workItemTypes => {
                            const descriptionSet: { [description: string]: void } = {};
                            const descriptions: { [witName: string]: string } = {};
                            for (const wit of workItemTypes) {
                                for (const field of wit.fieldInstances) {
                                    if (field.referenceName === matchedField.referenceName && field.helpText) {
                                        descriptions[wit.name] = field.helpText;
                                        descriptionSet[field.helpText] = void 0;
                                    }
                                }
                            }
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
