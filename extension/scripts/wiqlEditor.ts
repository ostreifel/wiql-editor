import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { getCompletionProvider } from "./wiqlCompletion";
import { parse } from "./compiler/wiqlParser";
import { format } from "./wiqlFormatter";
import { ErrorChecker } from "./wiqlErrorCheckers/ErrorChecker";
import * as Wiql from "./wiqlDefinition";
import { setVersion } from "./queryResults";
import { getHoverProvider } from "./wiqlHoverProvider";

export function setupEditor(target: HTMLElement, onChange?: (errorCount: number) => void, intialValue?: string): monaco.editor.IStandaloneCodeEditor {
    monaco.languages.register(Wiql.def);
    monaco.languages.onLanguage(Wiql.def.id, () => {
        monaco.languages.setMonarchTokensProvider(Wiql.def.id, Wiql.language);
        monaco.languages.setLanguageConfiguration(Wiql.def.id, Wiql.conf);
    });
    const defaultVal =
        `SELECT [ID], [Work Item Type], [Title], [State], [Area Path], [Iteration Path] 
        FROM workitems
        where [Team Project] = @project
        ORDER BY [System.ChangedDate] DESC`;
    const editor = monaco.editor.create(target, {
        language: Wiql.def.id,
        value: intialValue || defaultVal,
        automaticLayout: true
    });

    getWitClient().getFields().then((fields) => {
        monaco.languages.registerCompletionItemProvider(Wiql.def.id, getCompletionProvider(fields));
        monaco.languages.registerHoverProvider(Wiql.def.id, getHoverProvider(fields));
        const model = editor.getModel();
        const errorChecker = new ErrorChecker(fields);
        let oldDecorations: string[] = [];
        format(editor, fields);
        editor.addAction({
            id: "format",
            contextMenuGroupId: "1_modification",
            label: "Format",
            keybindings: [
                monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F,
                monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F
            ],
            run: e => { format(editor, fields); return null as any; }
        });
        editor.addAction({
            id: "import",
            contextMenuGroupId: "1_modification",
            label: "Import from wiq file",
            keybindings: [
                monaco.KeyMod.Alt | monaco.KeyCode.KEY_O
            ],
            run: e => {
                return new monaco.Promise<void>(callback => {
                    const fileInput = document.createElement("input");
                    fileInput.setAttribute("type", "file");
                    fileInput.setAttribute("accept", ".wiq");
                    fileInput.onchange = (ev) => {
                        ev.preventDefault();
                        const files = fileInput.files;
                        if (!files || files.length === 0) {
                            console.log("No file selected");
                            callback(undefined);
                            return false;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                            const text: string = reader.result;
                            const edit = <monaco.editor.IIdentifiedSingleEditOperation>{
                                text,
                                range: model.getFullModelRange(),
                                forceMoveMarkers: true,
                            };
                            model.pushEditOperations(editor.getSelections(), [edit], () => [new monaco.Selection(1, 1, 1, 1)]);
                            callback(undefined);
                        };
                        reader.readAsText(files[0]);
                        return false;
                    };
                    fileInput.click();
                });
             }
        });

        function checkErrors(): number {
            const lines = model.getLinesContent();
            const parseResult = parse(lines);
            const errors = errorChecker.check(parseResult);
            oldDecorations = model.deltaDecorations(oldDecorations, errors);
            return errors.length;
        }
        checkErrors();
        editor.onDidChangeModelContent(() => {
            const errorCount = checkErrors();
            if (onChange) {
                onChange(errorCount);
            }
        });
    });

    editor.focus();
    setVersion();
    return editor;
}
