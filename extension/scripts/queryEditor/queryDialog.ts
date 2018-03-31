import { IQuery, IContextOptions, ICallbacks } from "../queryContext/contextContracts";
import { trackEvent } from "../events";

function saveErrorMessage(error: TfsError, query: IQuery) {
    if (!isSupportedQueryId(query.id)) {
        return "Only queries in saved in My Queries or Shared Queries can be updated with this extension";
    }
    const exception = (error.serverError || error);
    const message = exception["message"] || exception["value"]["Message"];
    return message;
}

export async function showDialog(query: IQuery) {
    const dialogService = await VSS.getService<IHostDialogService>(VSS.ServiceIds.Dialog);
    console.log(query);
    let okCallback: () => Promise<any> = async () => {
        console.log("ok callback not set");
    };
    let closeDialog = () => {
        console.log("could not find close dialog function");
    };
    function close() {
        trackEvent("keyboardExit");
        closeDialog();
    }
    function save() {
        okCallback().then(() => {
            VSS.getService(VSS.ServiceIds.Navigation).then(function (navigationService: IHostNavigationService) {
                navigationService.reload();
            });
        }, (error: TfsError) => {
            const message = saveErrorMessage(error, query);
            dialogService.openMessageDialog(message, {
                title: "Error saving query"
            });
            trackEvent("SaveQueryFailure", {message});
        });
        throw Error("Exception to block dialog close");
    }
    const context: IContextOptions = {
        query: query,
        save,
        close,
    };
    const dialogOptions: IHostDialogOptions = {
        title: query.name,
        width: Number.MAX_VALUE,
        height: Number.MAX_VALUE,
        getDialogResult: save,
        okText: "Save Query",
        resizable: true,
    };
    const extInfo = VSS.getExtensionContext();

    const contentContribution = `${extInfo.publisherId}.${extInfo.extensionId}.contextForm`;
    const dialog = await dialogService.openDialog(contentContribution, dialogOptions, context);
    closeDialog = () => dialog.close();
    dialog.getContributionInstance("contextForm").then((callbacks: ICallbacks) => {
        okCallback = callbacks.okCallback;
        callbacks.setUpdateSaveButton((enabled) => {
            dialog.updateOkButton(enabled);
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
    return queryExclusionList.indexOf(id.toUpperCase()) === -1;
}
