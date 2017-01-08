import { IQuery, IContextOptions, ICallbacks } from "./contextContracts";
import * as Q from "q";

export function showDialog(query: IQuery) {

    VSS.getService(VSS.ServiceIds.Dialog).then(function (dialogService: IHostDialogService) {
        console.log(query);
        let okCallback: () => IPromise<any> = () => {
            console.log("ok callback not set");
            return Q(null);
        };
        let closeDialog = () => {
            console.log("could not find close dialog function");
        };
        function save() {
                console.log(this);
                okCallback().then(() => {
                    VSS.getService(VSS.ServiceIds.Navigation).then(function (navigationService: IHostNavigationService) {
                        navigationService.reload();
                    });
                }, (error: TfsError) => {
                    const exception = (error.serverError || error);
                    const message = exception["message"] || exception["value"]["Message"];
                    dialogService.openMessageDialog(message);
                });
                return "";
        }
        const context: IContextOptions = {
            query: query,
            save
        };
        const dialogOptions: IHostDialogOptions = {
            title: query.name,
            width: 900,
            height: 800,
            getDialogResult: save,
            okText: "Save Query",
            resizable: true,
        };
        const extInfo = VSS.getExtensionContext();

        const contentContribution = `${extInfo.publisherId}.${extInfo.extensionId}.contextForm`;
        dialogService.openDialog(contentContribution, dialogOptions, context).then((dialog) => {
            closeDialog = () => dialog.close();
            dialog.getContributionInstance("contextForm").then((callbacks: ICallbacks) => {
                okCallback = callbacks.okCallback;
                callbacks.setUpdateSaveButton((enabled) => {
                    dialog.updateOkButton(enabled);
                });
            });
        });
    });
}

namespace WellKnownQueries {
    export const AssignedToMe = "A2108D31-086C-4FB0-AFDA-097E4CC46DF4";
    export const UnsavedWorkItems = "B7A26A56-EA87-4C97-A504-3F028808BB9F";
    export const FollowedWorkItems = "202230E0-821E-401D-96D1-24A7202330D0";
    export const CreatedBy = "53FB153F-C52C-42F1-90B6-CA17FC3561A8";
    export const SearchResults = "2CBF5136-1AE5-4948-B59A-36F526D9AC73";
    export const CustomWiql = "08E20883-D56C-4461-88EB-CE77C0C7936D";
    export const RecycleBin = "2650C586-0DE4-4156-BA0E-14BCFB664CCA";
}

const queryExclusionList = [
    WellKnownQueries.AssignedToMe,
    WellKnownQueries.UnsavedWorkItems,
    WellKnownQueries.FollowedWorkItems,
    WellKnownQueries.CreatedBy,
    WellKnownQueries.SearchResults,
    WellKnownQueries.CustomWiql,
    WellKnownQueries.RecycleBin];

export function isSupportedQueryId(id: string) {
    return id !== "" && queryExclusionList.indexOf(id.toUpperCase()) === -1;
}
