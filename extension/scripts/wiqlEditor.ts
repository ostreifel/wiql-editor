import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { getCompletionProvider } from "./wiqlCompletion";
import { parse } from "./compiler/wiqlParser";
import { format } from "./wiqlFormatter";
import { ErrorChecker } from "./wiqlErrorCheckers/ErrorChecker";
import * as Wiql from "./wiqlDefinition";
import { setVersion } from "./queryResults";
import { getHoverProvider } from "./wiqlHoverProvider";
import { importWiq, exportWiq } from "./wiqImportExport";

export function setupEditor(target: HTMLElement, onChange?: (errorCount: number) => void, intialValue?: string, queryName?: string): monaco.editor.IStandaloneCodeEditor {
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
        $(".wiq-input").change(() => importWiq(editor));
        $(".wiq-export").click(() => exportWiq(editor, queryName));

        function checkErrors(): Q.IPromise<number> {
            const lines = model.getLinesContent();
            const parseResult = parse(lines);
            return errorChecker.check(parseResult).then(errors => {
                oldDecorations = model.deltaDecorations(oldDecorations, errors);
                return errors.length;
            });
        }
        checkErrors();
        editor.onDidChangeModelContent(() => {
            checkErrors().then(errorCount => {
                if (onChange) {
                    onChange(errorCount);
                }
            });
        });
    });

    editor.focus();
    setVersion();
    return editor;
}
