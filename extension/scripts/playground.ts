import { WorkItemQueryResult } from "TFS/WorkItemTracking/Contracts";
import { renderResult, setError, setMessage } from "./queryResults";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { setupEditor } from "./wiqlEditor";
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
        return;
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


const target = document.getElementById("wiql-box");
if (!target) {
    throw new Error("Could not find wiql editor div");
}
const editor = setupEditor(target);
editor.addAction({
    id: "run",
    contextMenuGroupId: "results",
    label: "Run",
    keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],
    keybindingContext: undefined,
    contextMenuOrder: 1,
    run: e => { search(); return <any>null; }
});
editor.addAction({
    id: "focus-results",
    label: "Focus Results",
    contextMenuGroupId: "results",
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KEY_R],
    run: e => {
        const trs = $(".row");
        if (trs.length > 0) {
            trs.first().focus();
        }
        return null as any;
    }
});
function getAction(id: string) {
    return () => editor.getActions().filter(a => a.id === id)[0].run();
}
$(".run-button").click(getAction("run"));
$(".format-button").click(getAction("format"));

setMessage([
    "Key bindings:",
    "Shift + Enter : Run",
    "Alt + Shift + F or Ctr + Shift + F : Format",
    "Alt + R : Apply focus to first result",
]);

// Register context menu action provider
VSS.register(VSS.getContribution().id, {});
