import { WorkItem, WorkItemReference, WorkItemQueryResult } from 'TFS/WorkItemTracking/Contracts';
import { renderQueryResults, setError, setMessage } from './queryResults';
import { getClient as getWitClient } from 'TFS/WorkItemTracking/RestClient';
import { setupEditor } from './wiqlEditor';


function onChange(errorCount: number): void {
    if (errorCount > 0) {
        setError('Resolve errors to search');
    } else {
        search();
    }
}
const target = document.getElementById('wiql-box');
if (!target) {
    throw new Error('Could not find wiql editor div');
}
const editor = setupEditor(target, onChange);
function loadWorkItems(result: WorkItemQueryResult) {
    if (result.workItems.length === 0) {
        setMessage('No work items found');
        return;
    }
    setMessage('Loading workitems...');

    const wiIds = result.workItems.map((wi) => wi.id);
    let fieldRefNames = result.columns.length < 10 ?
        result.columns.map((col) => col.referenceName)
        : undefined;
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
