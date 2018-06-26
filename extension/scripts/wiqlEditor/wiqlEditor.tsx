import * as React from "react";
import * as ReactDom from "react-dom";
import { DelayedFunction } from "VSS/Utils/Core";
import { trackEvent } from "../events";
import { parse } from "./compiler/parser";
import { completionProvider } from "./completion/completion";
import { ErrorChecker } from "./errorCheckers/ErrorChecker";
import { format } from "./formatter";
import { getHoverProvider } from "./hoverProvider";
import { exportWiq, importWiq } from "./importExport";
import * as Wiql from "./wiqlDefinition";

function renderToolbar(callback: () => void) {
    const elem = document.getElementById("header-bar");
    if (!elem) {
        return;
    }
    ReactDom.render(
            <div className="header">
                <span className="bowtie">
                    <input className="wiq-input" accept=".wiq" type="file"/>
                    <button onClick={() => $(".wiq-input").click()}>Import</button>
                    <button className="wiq-export">Export</button>
                    <button className="open-in-queries" hidden>Open in queries</button>
                </span>
                <span className="links">
                    <a href="https://marketplace.visualstudio.com/items?itemName=ottostreifel.wiql-editor" target="_blank">Review</a>{" | "}
                    <a href="https://github.com/ostreifel/wiql-editor/issues" target="_blank">Report an issue</a>{" | "}
                    <a href="mailto:wiqleditor@microsoft.com" target="_blank">Feedback and questions</a>
                </span>
            </div>
        , elem, callback);
}

export function setupEditor(target: HTMLElement, onChange?: (errorCount: number) => void, intialValue?: string, queryName?: string): monaco.editor.IStandaloneCodeEditor {
    renderToolbar(async () => {
        if (queryName) {
            return;
        }
        const navigationService = await VSS.getService(VSS.ServiceIds.Navigation) as IHostNavigationService;
        $(".open-in-queries").show().click(() => {
            const wiql = editor.getModel().getValue();
            trackEvent("openInQueries", {wiqlLength: String(wiql.length)});
            const {host, project} = VSS.getWebContext();
            const url = `${host.uri}/${project.id}/_queries/query/?wiql=${encodeURIComponent(wiql)}`;
            navigationService.openNewWindow(url, "");
        });
    });
    monaco.languages.register(Wiql.def);
    monaco.languages.onLanguage(Wiql.def.id, () => {
        monaco.languages.setMonarchTokensProvider(Wiql.def.id, Wiql.language);
        monaco.languages.setLanguageConfiguration(Wiql.def.id, Wiql.conf);
    });
    const defaultVal =
        `SELECT
        [System.Id],
        [System.WorkItemType],
        [System.Title],
        [System.State],
        [System.AreaPath],
        [System.IterationPath]
FROM workitems
WHERE
        [System.TeamProject] = @project
ORDER BY [System.ChangedDate] DESC
`;
    const editor = monaco.editor.create(target, {
        language: Wiql.def.id,
        value: intialValue || defaultVal,
        automaticLayout: true,
        wordWrap: true,
    });

    format(editor);
    editor.addAction({
        id: "format",
        contextMenuGroupId: "1_modification",
        label: "Format",
        keybindings: [
            monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F,
            monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F,
        ],
        run: () => { format(editor); return null as any; },
    });
    $(".wiq-input").change(() => importWiq(editor));
    $(".wiq-export").click(() => exportWiq(editor, queryName));
    monaco.languages.registerHoverProvider(Wiql.def.id, getHoverProvider());
    monaco.languages.registerCompletionItemProvider(Wiql.def.id, completionProvider);

    const model = editor.getModel();
    const errorChecker = new ErrorChecker();
    let oldDecorations: string[] = [];

    function checkErrors(): Promise<number> {
        const lines = model.getLinesContent();
        const parseResult = parse(lines);
        return errorChecker.check(parseResult).then((errors) => {
            oldDecorations = model.deltaDecorations(oldDecorations, errors);
            return errors.length;
        });
    }
    checkErrors();

    const updateErrors = new DelayedFunction(null, 200, "CheckErrors", () => {
        checkErrors().then((errorCount) => {
            if (onChange) {
                onChange(errorCount);
            }
        });
    });
    editor.onDidChangeModelContent(() => {
        updateErrors.reset();
    });

    editor.focus();
    return editor;
}
