import { CachedValue } from "./CachedValue";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";
import { projects } from "./projects";
import { TeamProjectReference } from "TFS/Core/Contracts";
import * as Q from "q";

export interface ProjectWorkItemsTypes {
    project: TeamProjectReference;
    workItemTypes: WorkItemType[];
}
export const workItemTypesByProject: CachedValue<ProjectWorkItemsTypes[]> = new CachedValue(getWits);

function getWits() {
    return projects.getValue().then(projects => {
        const witPromises = projects.map(project =>
            getWitClient().getWorkItemTypes(project.id).then(workItemTypes => {
                return {project, workItemTypes} as ProjectWorkItemsTypes;
            })
        );
        return Q.all(witPromises);
    });
}
