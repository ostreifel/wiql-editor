/// <reference types="vss-web-extension-sdk" />
import "promise-polyfill/src/polyfill";
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
async function saveQuery(): Promise<string | null> {
    const context = VSS.getWebContext();
    const queryItem = <QueryHierarchyItem> {
        wiql: editor.getValue(),
        path: configuration.query.path,
        name: configuration.query.name,
    };
    trackEvent("SaveQuery", {wiqlLength: "" + editor.getValue().length, isNew: "" + !configuration.query.id});
    if (configuration.query.id && configuration.query.id !== "00000000-0000-0000-0000-000000000000") {
        const updated = await getWitClient().updateQuery(queryItem, context.project.name, configuration.query.id);
        const html = updated._links ? updated._links.html : null;
        return html ? html.href : "";
    } else {
        const path = configuration.query.isPublic ? "Shared Queries" : "My Queries";
        const name = prompt("Enter name for query");
        if (name) {
            queryItem.name = name;
            const created = await getWitClient().createQuery(queryItem, context.project.name, path);
            const html = created._links ? created._links.html : null;
            return html ? html.href : "";
        }
    }
    return null;
}
const callbacks: ICallbacks = {
    okCallback: saveQuery,
};
configuration.loaded(callbacks);
