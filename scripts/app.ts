import {getClient as getWitClient} from "TFS/WorkItemTracking/RestClient";
import {WorkItem, WorkItemReference, WorkItemQueryResult} from "TFS/WorkItemTracking/Contracts";
import {renderQueryResults, renderError, setLoadingMessage} from "./queryResults";

const editor = monaco.editor.create(document.getElementById('wiql-box'), {
            value: `select title from workitems`,
            language: 'sql'
        });

function loadWorkItems(result: WorkItemQueryResult) {
    setLoadingMessage('Loading workitems...');

    const wiIds = result.workItems.map((wi) => wi.id);
    const fieldRefNames = result.columns.map((col) => col.referenceName);
    getWitClient().getWorkItems(wiIds, fieldRefNames, result.asOf).then(
        (workItems) => renderQueryResults(result, workItems), renderError); 
}

function search() {
    const wiqlText = editor.getValue();
    setLoadingMessage('Running query...');
    getWitClient().queryByWiql({query: wiqlText}).then(loadWorkItems, renderError);
}

$('.search-button').click(() => search());

// Register context menu action provider
VSS.register(VSS.getContribution().id, {});