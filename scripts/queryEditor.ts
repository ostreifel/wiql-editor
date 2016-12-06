import { setupEditor } from './wiqlEditor';
import { QueryHierarchyItem } from 'TFS/WorkItemTracking/Contracts';
import { getClient as getWITClient } from 'TFS/WorkItemTracking/RestClient';
import { IQuery, IContextOptions } from './contextContracts';

const configuration: IContextOptions = VSS.getConfiguration();
const target = document.getElementById('wiql-box');
if (!target) {
    throw new Error('Could not find wiql editor div');
}
const editor = setupEditor(target, (count) => configuration.updateSaveButton(count === 0), configuration.query.wiql);
function saveQuery() {
    const context = VSS.getWebContext();
    getWITClient().updateQuery(<QueryHierarchyItem>{
        wiql: editor.getValue(),
        path: configuration.query.path,
    }, context.project.name, configuration.query.name);
}
configuration.okCallback = saveQuery;

VSS.register(VSS.getContribution().id, {});
