import { setupEditor } from './wiqlEditor';

const target = document.getElementById('wiql-box');
if (!target) {
    throw new Error('Could not find wiql editor div');
}
const editor = setupEditor(target);

const showPropertiesMenuProvider = {
    showPropertiesInDialog: function (properties, title) {


        VSS.getService(VSS.ServiceIds.Dialog).then(function (dialogService: IHostDialogService) {

            const extInfo = VSS.getExtensionContext();

            const dialogOptions: IHostDialogOptions = {
                title: title || 'Properties',
                width: 800,
                height: 600,
                okCallback: () => console.log('ok clicked'),
                okText: 'Save Query'
            };

            const contributionConfig = {
                properties: properties
            };

            dialogService.openDialog(VSS.getContribution().id, dialogOptions, contributionConfig).then((dialog) => {
                console.log('dialog opened');
                console.log(properties);
                console.log(Window);
            });
        });
    },
    execute: function (actionContext) {
        this.showPropertiesInDialog(actionContext);
    }
};

VSS.register('showProperties', function (context) {
    return showPropertiesMenuProvider;
});
