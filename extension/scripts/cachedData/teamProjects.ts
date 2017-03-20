import { CachedValue } from "./CachedValue";
import { callApi } from "../RestCall";
import * as Q from "q";
import { ITeamProjects, ITeamField } from "./teamProjectsContracts";

export const teamProjects: CachedValue<ITeamProjects> = new CachedValue(getTeamProjects);
export const fields: CachedValue<ITeamField[]> = new CachedValue(() => teamProjects.getValue().then(projs => projs.fields));

function getTeamProjects() {
    const webContext = VSS.getWebContext();
    const url = webContext.account.uri + "DefaultCollection/_api/_wit/teamProjects?__v=5&includeFieldDefinitions=true";
    const deferredProjects = Q.defer<any>();
    callApi(url, "GET", undefined, undefined, (projects) => {
        deferredProjects.resolve(projects);
    }, (error, errorThrown, status) => {
        deferredProjects.reject(error);
    });
    return deferredProjects.promise;
}
