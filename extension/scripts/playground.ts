import { WorkItem, WorkItemReference, WorkItemQueryResult } from "TFS/WorkItemTracking/Contracts";
import { renderResult, setError, setMessage } from "./queryResults";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { setupEditor } from "./wiqlEditor";

const target = document.getElementById("wiql-box");
if (!target) {
    throw new Error("Could not find wiql editor div");
}
const editor = setupEditor(target);
function loadWorkItems(result: WorkItemQueryResult) {
    if (result.workItems.length === 0) {
        setMessage("No work items found");
        return;
    }
    setMessage("Loading workitems...");

    const wiIds = result.workItems.map((wi) => wi.id);
    const fieldRefNames = result.columns.length < 10 ?
        result.columns.map((col) => col.referenceName)
        : undefined;
    getWitClient().getWorkItems(wiIds, fieldRefNames, result.asOf).then(
        workItems => renderResult(result, workItems), setError);
}
function loadWorkItemRelations(result: WorkItemQueryResult) {
    if (result.workItemRelations.length === 0) {
        setMessage("No work item relations found");
    }
    setMessage("Loading workitem relations...");
    const ids: number[] = [];

    for (let relation of result.workItemRelations) {
        if (relation.source && ids.indexOf(relation.source.id) < 0) {
            ids.push(relation.source.id);
        }
        if (ids.indexOf(relation.target.id) < 0) {
            ids.push(relation.target.id);
        }
    }
    const fieldRefNames = result.columns.length < 10 ?
        result.columns.map((col) => col.referenceName)
        : undefined;
    getWitClient().getWorkItems(ids, fieldRefNames, result.asOf).then(
        workitems => renderResult(result, workitems), setError);
}

function search() {
    const wiqlText = editor.getValue();
    setMessage("Running query...");
    const context = VSS.getWebContext();
    getWitClient().queryByWiql({ query: wiqlText }, context.project.name, context.team.name, undefined, 50).then(
        result => result.workItems ? loadWorkItems(result) : loadWorkItemRelations(result), setError);
}

setMessage([
    "Key bindings:",
    "Shift + Enter : search",
    "Alt + Shift + F or Ctr + Shift + F : format",
]);
$(window).keydown((event) => {
    if (event.shiftKey && event.which === 13) {
        event.preventDefault();
        search();
    }
});

// Register context menu action provider
VSS.register(VSS.getContribution().id, {});
