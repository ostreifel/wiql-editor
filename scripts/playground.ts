import { getClient as getWitClient } from 'TFS/WorkItemTracking/RestClient';
import { WorkItem, WorkItemReference, WorkItemQueryResult } from 'TFS/WorkItemTracking/Contracts';
import { renderQueryResults, setError, setMessage } from './queryResults';
import * as Wiql from './wiqlDefinition';
import { getCompletionProvider } from './wiqlCompletion';
import { ErrorChecker } from './wiqlErrorCheckers/ErrorChecker';
import { parse } from './wiqlParser';
import { format } from './wiqlFormatter';

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
    editor.onDidChangeModelContent((event) => {
        const lines = model.getLinesContent();
        const parseResult = parse(lines);
        const errors = errorChecker.check(parseResult);
        oldDecorations = model.deltaDecorations(oldDecorations, errors);
        if (errors.length > 0) {
            setError('Resolve errors to search');
        } else {
            search();
        }
    });
    $(window).keydown((event) => {
        if ((event.altKey && event.shiftKey && event.which === 70) ||
            (event.ctrlKey && event.shiftKey && event.which === 70)) {
            event.preventDefault();
            format(editor.getModel(), fields);
        }
    });
});

const editor = monaco.editor.create(<HTMLElement>document.getElementById('wiql-box'), {
    value: `select id, [work item type], title, state, [area path], [iteration path] from workitems`,
    language: Wiql.def.id,
});



function loadWorkItems(result: WorkItemQueryResult) {
    if (result.workItems.length === 0) {
        setMessage('No work items found');
        return;
    }
    setMessage('Loading workitems...');

    const wiIds = result.workItems.map((wi) => wi.id);
    const fieldRefNames = result.columns.map((col) => col.referenceName);
    getWitClient().getWorkItems(wiIds, fieldRefNames, result.asOf).then(
        (workItems) => {
            const wiMap = {};
            for (let wi of workItems) {
                wiMap[wi.id] = wi;
            }
            renderQueryResults(result, wiIds.map((id) => wiMap[id]));
        }, setError);
}

function search() {
    const wiqlText = editor.getValue();
    setMessage('Running query...');
    const context = VSS.getWebContext();
    getWitClient().queryByWiql({ query: wiqlText }, context.project.name, context.team.name, undefined, 50).then(loadWorkItems, setError);
}

setMessage([
    'Key bindings:',
    'Shift + Enter : search',
    'Alt + Shift + F or Ctr + Shift + F : format',
]);
$(window).keydown((event) => {
    if (event.shiftKey && event.which === 13) {
        event.preventDefault();
        search();
    }
});

// Register context menu action provider
VSS.register(VSS.getContribution().id, {});
