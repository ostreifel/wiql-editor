import { getClient as getWitClient } from 'TFS/WorkItemTracking/RestClient';
import { getCompletionProvider } from './wiqlCompletion';
import { parse } from './wiqlParser';
import { format } from './wiqlFormatter';
import { ErrorChecker } from './wiqlErrorCheckers/ErrorChecker';
import * as Wiql from './wiqlDefinition';

export function setupEditor(target: HTMLElement, onChange?: (errorCount: number) => void, intialValue?: string): monaco.editor.IStandaloneCodeEditor {
    monaco.languages.register(Wiql.def);
    monaco.languages.onLanguage(Wiql.def.id, () => {
        monaco.languages.setMonarchTokensProvider(Wiql.def.id, Wiql.language);
        monaco.languages.setLanguageConfiguration(Wiql.def.id, Wiql.conf);
    });
    getWitClient().getFields().then((fields) => {
        monaco.languages.registerCompletionItemProvider(Wiql.def.id, getCompletionProvider(fields));
        const model = editor.getModel();
        const errorChecker = new ErrorChecker(fields);
        let oldDecorations: string[] = [];
        intialValue = intialValue ||
            `SELECT [ID], [Work Item Type], [Title], [State], [Area Path], [Iteration Path] FROM workitems where [Team Project] = @project`;
        editor.setValue(intialValue);
        format(editor.getModel(), fields);
        $(window).keydown((event) => {
            if ((event.altKey && event.shiftKey && event.which === 70) ||
                (event.ctrlKey && event.shiftKey && event.which === 70)) {
                event.preventDefault();
                format(editor.getModel(), fields);
            }
        });
        editor.onDidChangeModelContent((event) => {
            const lines = model.getLinesContent();
            const parseResult = parse(lines);
            const errors = errorChecker.check(parseResult);
            oldDecorations = model.deltaDecorations(oldDecorations, errors);
            if (onChange) {
                onChange(errors.length);
            }
        });
    });

    const editor = monaco.editor.create(target, {
        language: Wiql.def.id,
        automaticLayout: true
    });
    return editor;
}
