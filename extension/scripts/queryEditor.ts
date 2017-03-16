import { setupEditor } from "./wiqlEditor";
import { QueryHierarchyItem } from "TFS/WorkItemTracking/Contracts";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { IContextOptions, ICallbacks } from "./contextContracts";

const configuration: IContextOptions = VSS.getConfiguration();
const target = document.getElementById("wiql-box");
if (!target) {
    throw new Error("Could not find wiql editor div");
}
let updateSaveButton = (enabled: boolean) => {
    console.log("update button not set");
};

const editor = setupEditor(target, (count) => updateSaveButton(true), configuration.query.wiql, configuration.query.name);
editor.addAction({
    id: "save",
    contextMenuGroupId: "modification",
    label: "Save",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
    run: e => {
        configuration.save();
        return null as any;
    }
});
function saveQuery(): IPromise<any> {
    console.log("saving query");
    const context = VSS.getWebContext();
    const queryItem = <QueryHierarchyItem>{
        wiql: editor.getValue(),
        path: configuration.query.path,
        name: configuration.query.name,
    };
    if (configuration.query.id) {
        return getWitClient().updateQuery(queryItem, context.project.name, configuration.query.id);
    } else {
        const path = configuration.query.isPublic ? "Shared Queries" : "My Queries";
        return getWitClient().createQuery(queryItem, context.project.name, path);
    }
}
const callbacks: ICallbacks = {
    okCallback: saveQuery,
    setUpdateSaveButton: (callback) => updateSaveButton = callback
};
VSS.register("contextForm", callbacks);

