import { IQuery, IContextOptions, ICallbacks } from './contextContracts';

function showDialog(query: IQuery) {

    VSS.getService(VSS.ServiceIds.Dialog).then(function (dialogService: IHostDialogService) {
        const context: IContextOptions = {
            query: query,
        };
        console.log(query);
        let okCallback: () => IPromise<any> = () => {
            console.log('ok callback not set');
            return Q(null);
        };
        let closeDialog = () => {
            console.log('could not find close dialog function');
        }
        let updateSaveButton = (enabled: boolean) => { };
        const dialogOptions: IHostDialogOptions = {
            title: query.name,
            width: 800,
            height: 600,
            getDialogResult: function () {
                console.log('calling getDialogResult');
                console.log(this);
                okCallback().then(() => {
                    VSS.getService(VSS.ServiceIds.Navigation).then(function (navigationService: IHostNavigationService) {
                        navigationService.reload();
                    });
                }, (error: TfsError) => {
                    const message = (error.serverError || error)['message'];
                    dialogService.openMessageDialog(message);
                });
                return '';
            },
            okText: 'Save Query',
            resizable: false,
        };
        const extInfo = VSS.getExtensionContext();

        const contentContribution = `${extInfo.publisherId}.${extInfo.extensionId}.contextForm`;
        dialogService.openDialog(contentContribution, dialogOptions, context).then((dialog) => {
            console.log('dialog opened');
            closeDialog = () => dialog.close();
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
