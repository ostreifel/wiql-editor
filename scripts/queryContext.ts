
import { IQuery, IContextOptions, ICallbacks } from './contextContracts';

function showDialog(query: IQuery) {

    VSS.getService(VSS.ServiceIds.Dialog).then(function (dialogService: IHostDialogService) {
        let i = 0;
        const context: IContextOptions = {
            query: query,
        };
        let okCallback: () => void = () => {
            console.log('ok callback not set');
         };
        let updateSaveButton = (enabled: boolean) => { };
        const dialogOptions: IHostDialogOptions = {
            title: query.name,
            width: 800,
            height: 600,
            okCallback: () => {
                console.log('calling ok callback');
                okCallback();
            },
            okText: 'Save Query',
            resizable: false,
        };
        const extInfo = VSS.getExtensionContext();

        const contentContribution = `${extInfo.publisherId}.${extInfo.extensionId}.contextForm`;
        dialogService.openDialog(contentContribution, dialogOptions, context).then((dialog) => {
            console.log('dialog opened');
            dialog.getContributionInstance(contentContribution + '.callbacks').then((callbacks: ICallbacks) => {
                console.log('got contribution intance');
                okCallback = callbacks.okCallback;
                callbacks.setUpdateSaveButton((enabled) => {
                    console.log('updating ok button');
                    dialog.updateOkButton(enabled);
                });
            });
        });
    });
}

VSS.register('showProperties', {
    execute: function (actionContext) {
        showDialog(actionContext.query);
    }
});
