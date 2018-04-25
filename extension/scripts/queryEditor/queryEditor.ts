/// <reference types="vss-web-extension-sdk" />
import { QueryHierarchyItem } from "TFS/WorkItemTracking/Contracts";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";

import { trackEvent } from "../events";
import { ICallbacks, IContextOptions } from "../queryContext/contextContracts";
import { setupEditor } from "../wiqlEditor/wiqlEditor";

trackEvent("pageLoad");
const configuration: IContextOptions = VSS.getConfiguration();
const target = document.getElementById("wiql-box");
if (!target) {
    throw new Error("Could not find wiql editor div");
}

const editor = setupEditor(target, undefined, configuration.query.wiql, configuration.query.name);
editor.addAction({
    id: "save",
    contextMenuGroupId: "modification",
    label: "Save",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
    run: () => {
        configuration.save();
        return null as any;
    },
});
editor.addAction({
    id: "exit",
    contextMenuGroupId: "navigation",
    label: "Exit",
    run: () => {
        configuration.close();
        return null as any;
    },
});
async function saveQuery(): Promise<any> {
    const context = VSS.getWebContext();
    const queryItem = <QueryHierarchyItem> {
        wiql: editor.getValue(),
        path: configuration.query.path,
        name: configuration.query.name,
    };
    trackEvent("SaveQuery", {wiqlLength: "" + editor.getValue().length, isNew: "" + !configuration.query.id});
    if (configuration.query.id) {
        return await getWitClient().updateQuery(queryItem, context.project.name, configuration.query.id);
    } else {
        const path = configuration.query.isPublic ? "Shared Queries" : "My Queries";
        return await getWitClient().createQuery(queryItem, context.project.name, path);
    }
}
const callbacks: ICallbacks = {
    okCallback: saveQuery,
};
VSS.register("contextForm", callbacks);
