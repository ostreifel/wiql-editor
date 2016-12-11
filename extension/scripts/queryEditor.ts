import { setupEditor } from './wiqlEditor';
import { QueryHierarchyItem } from 'TFS/WorkItemTracking/Contracts';
import { getClient as getWITClient } from 'TFS/WorkItemTracking/RestClient';
import { IQuery, IContextOptions, ICallbacks } from './contextContracts';

const configuration: IContextOptions = VSS.getConfiguration();
const target = document.getElementById('wiql-box');
if (!target) {
    throw new Error('Could not find wiql editor div');
}
let updateSaveButton = (enabled: boolean) => {
    console.log('update button not set');
}
const editor = setupEditor(target, (count) => updateSaveButton(true), configuration.query.wiql);
function saveQuery(): IPromise<any> {
    console.log('saving query');
    const context = VSS.getWebContext();
    const queryItem = <QueryHierarchyItem>{
        wiql: editor.getValue(),
        path: configuration.query.path,
        name: configuration.query.name,
    };
    if (configuration.query.id) {
        return getWITClient().updateQuery(queryItem, context.project.name, configuration.query.id);
    } else {
        return getWITClient().createQuery(queryItem, context.project.name, configuration.query.id);
    }
}
const callbacks: ICallbacks = {
    okCallback: saveQuery,
    setUpdateSaveButton: (callback) => updateSaveButton = callback
};
VSS.register(VSS.getContribution().id + '.callbacks', callbacks);

