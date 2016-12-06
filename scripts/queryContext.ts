
import { IQuery, IContextOptions } from './contextContracts';

function showDialog(query: IQuery) {

    VSS.getService(VSS.ServiceIds.Dialog).then(function (dialogService: IHostDialogService) {
        const context: IContextOptions = {
            query: query,
            okCallback: () => {},
            updateSaveButton: (enabled: boolean) => {}
        }
        const dialogOptions: IHostDialogOptions = {
            title: query.name,
            width: 800,
            height: 600,
            okCallback: () => context.okCallback(),
            okText: 'Save Query',
            resizable: false,
        };
        const extInfo = VSS.getExtensionContext();

        dialogService.openDialog(`${extInfo.publisherId}.${extInfo.extensionId}.contextForm`, dialogOptions, context).then((dialog) => {
            console.log('dialog opened');
            context.updateSaveButton = (enabled) => {
                console.log('updating ok button', enabled);
                dialog.updateOkButton(enabled);
            };
        });
    });
}

VSS.register('showProperties', {
    execute: function (actionContext) {
        showDialog(actionContext.query);
    }
});
