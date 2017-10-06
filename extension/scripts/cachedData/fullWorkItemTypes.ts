import { callApi } from "../RestCall";

export function getFullWorkItemType(project, workItemTypeName: string): void {
    const webContext = VSS.getWebContext();
    // https://mseng.visualstudio.com/VSOnline/_apis/wit/workItemTypeTemplate/bug
    const witUrl = webContext.account.uri + "DefaultCollection/" + project + "/_apis/wit/workItemTypeTemplate/" + workItemTypeName + "?api-version=1.0";
    callApi(witUrl, "GET", undefined, undefined, (data) => console.log("wit data", data), (error) => console.log("wit error", error));
}
