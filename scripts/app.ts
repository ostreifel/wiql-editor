import {getClient as getWitClient} from "TFS/WorkItemTracking/RestClient";
import {WorkItem, WorkItemReference, WorkItemQueryResult} from "TFS/WorkItemTracking/Contracts";
import {renderQueryResults, renderError, setLoadingMessage} from "./queryResults";
import * as Wiql from "./wiql";

monaco.languages.register(Wiql.def);
monaco.languages.onLanguage(Wiql.def.id, () => {
    monaco.languages.setMonarchTokensProvider(Wiql.def.id, Wiql.language);
    monaco.languages.setLanguageConfiguration(Wiql.def.id, Wiql.conf);
})

const editor = monaco.editor.create(document.getElementById('wiql-box'), {
            value: `select title from workitems`,
            language: Wiql.def.id,
});


function loadWorkItems(result: WorkItemQueryResult) {
    setLoadingMessage('Loading workitems...');

    const wiIds = result.workItems.map((wi) => wi.id);
    const fieldRefNames = result.columns.map((col) => col.referenceName);
    getWitClient().getWorkItems(wiIds, fieldRefNames, result.asOf).then(
        (workItems) =>  { 
            const wiMap = {};
            for(let wi of workItems) {
                wiMap[wi.id] = wi;
            }
            renderQueryResults(result, wiIds.map((id) => wiMap[id]));
        }, renderError);
}

function search() {
    const wiqlText = editor.getValue();
    setLoadingMessage('Running query...');
    getWitClient().queryByWiql({query: wiqlText}).then(loadWorkItems, renderError);
}


editor.addAction({
	// An unique identifier of the contributed action.
	id: 'search-wiql',

	label: 'Seach Wiql',

	// An optional array of keybindings for the action.
	keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],

	keybindingContext: null,

	contextMenuGroupId: 'navigation',

	contextMenuOrder: 1.5,

	// Method that will be executed when the action is triggered.
	// @param editor The editor instance is passed in as a convinience
	run: (function(ed) {
		search();
		return null;
	})
})

$('.search-button').click(() => search());

// Register context menu action provider
VSS.register(VSS.getContribution().id, {});