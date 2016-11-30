import { getClient as getWitClient } from 'TFS/WorkItemTracking/RestClient';
import { WorkItem, WorkItemReference, WorkItemQueryResult } from 'TFS/WorkItemTracking/Contracts';
import { renderQueryResults, renderError, setMessage } from './queryResults';
import * as Wiql from './wiqlDefinition';
import { getCompletionProvider } from './wiqlCompletion';
import { getErrorHighlighter } from './wiqlErrorHighlighter';

monaco.languages.register(Wiql.def);
monaco.languages.onLanguage(Wiql.def.id, () => {
    monaco.languages.setMonarchTokensProvider(Wiql.def.id, Wiql.language);
    monaco.languages.setLanguageConfiguration(Wiql.def.id, Wiql.conf);
});
getWitClient().getFields().then((fields) => {
    monaco.languages.registerCompletionItemProvider(Wiql.def.id, getCompletionProvider(fields))
    const highlighter = getErrorHighlighter(editor.getModel(), fields);
    editor.onDidChangeModelContent(highlighter);
});

const editor = monaco.editor.create(<HTMLElement>document.getElementById('wiql-box'), {
    value: `select title from workitems`,
    language: Wiql.def.id,
});



function loadWorkItems(result: WorkItemQueryResult) {
    if (result.workItems.length == 0) {
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
        }, renderError);
}

function search() {
    const wiqlText = editor.getValue();
    setMessage('Running query...');
    getWitClient().queryByWiql({ query: wiqlText }).then(loadWorkItems, renderError);
}



setMessage('Press Shift+Enter to search');
$(window).bind('keydown', function (event) {
    if (event.shiftKey && event.which === 13) {
        event.preventDefault();
        search();
    }
})

// Register context menu action provider
VSS.register(VSS.getContribution().id, {});