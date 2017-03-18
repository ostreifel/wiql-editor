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

export const states: CachedValue<string[]> = new CachedValue(getStates);
function getStates() {
    return workItemTypesByProject.getValue().then(witsByProj => {
        const states: {[state: string]: void} = {};
        for (let {workItemTypes} of witsByProj) {
            for (let {transitions} of workItemTypes) {
                for (let startState in transitions) {
                    if (startState) {
                        states[startState] = undefined;
                    }
                    for (let {to: targetState} of transitions[startState]) {
                        if (targetState) {
                            states[targetState] = undefined;
                        }
                    }
                }
            }
        }
        return Object.keys(states);
    });
}

export const witNames: CachedValue<string[]> = new CachedValue(getWitNames);
function getWitNames() {
    return workItemTypesByProject.getValue().then(witsByProj => {
        const wits: {[name: string]: void} = {};
        for (let { workItemTypes } of witsByProj) {
            for (let {name} of workItemTypes) {
                wits[name] = undefined;
            }
        }
        return Object.keys(wits);
    });
}