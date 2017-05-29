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
export const allProjectWits: CachedValue<ProjectWorkItemsTypes[]> = new CachedValue(getWits);
function getWits() {
    return projects.getValue().then(projects => {
        const witPromises = projects.map(project =>
            getWitsByProject(project.name).then(workItemTypes => {
                return { project, workItemTypes } as ProjectWorkItemsTypes;
            })
        );
        return Q.all(witPromises);
    });
}

const projectsToWit: { [project: string]: CachedValue<WorkItemType[]> } = {};
function getWitsByProject(project: string): Q.IPromise<WorkItemType[]> {
    if (!(project in projectsToWit)) {
        projectsToWit[project] = new CachedValue(() => getWitClient().getWorkItemTypes(project));
    }
    return projectsToWit[project].getValue();

}
export function getWitsByProjects(projects: string[]): Q.IPromise<string[]> {
    if (projects.length > 0) {
        getWitNames();
    }
    return Q.all(projects.map(p => getWitsByProject(p))).then(witsArr => {
        const wits: WorkItemType[] = [];
        for (const arr of witsArr) {
            wits.push(...arr);
        }
        const names: { [wit: string]: void } = {};
        for (const { name } of wits) {
            names[name] = void 0;
        }
        return Object.keys(names);
    });
}

export const states: CachedValue<string[]> = new CachedValue(getStates);
function getStates() {
    return allProjectWits.getValue().then(witsByProj => {
        const states: { [state: string]: void } = {};
        for (let { workItemTypes } of witsByProj) {
            for (let { transitions } of workItemTypes) {
                for (let startState in transitions) {
                    if (startState) {
                        states[startState] = undefined;
                    }
                    for (let { to: targetState } of transitions[startState]) {
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
    return allProjectWits.getValue().then(witsByProj => {
        const wits: { [name: string]: void } = {};
        for (let { workItemTypes } of witsByProj) {
            for (let { name } of workItemTypes) {
                wits[name] = undefined;
            }
        }
        return Object.keys(wits);
    });
}