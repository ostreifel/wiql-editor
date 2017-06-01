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
            getWitsByProjects([project.name]).then(workItemTypes => {
                return { project, workItemTypes } as ProjectWorkItemsTypes;
            })
        );
        return Q.all(witPromises);
    });
}

const projectsToWit: { [project: string]: CachedValue<WorkItemType[]> } = {};
export function getWitsByProjects(projects: string[], searchWits?: string[]): Q.IPromise<WorkItemType[]> {
    for (const project of projects) {
        if (!(project in projectsToWit)) {
            projectsToWit[project] = new CachedValue(() => getWitClient().getWorkItemTypes(project));
        }
    }
    return Q.all(projects.map(p => projectsToWit[p].getValue())).then(witsArr => {
        const wits: WorkItemType[] = [];
        for (const arr of witsArr) {
            wits.push(...arr);
        }
        return searchWits ? wits.filter(w => searchWits.some(w2 => w2 === w.name)) : wits;
    });

}
export function getWitNamesByProjects(projects: string[]): Q.IPromise<string[]> {
    if (projects.length === 0) {
        getWitNames();
    }
    return getWitsByProjects(projects).then(wits => {
        const names: { [wit: string]: void } = {};
        for (const { name } of wits) {
            names[name] = void 0;
        }
        return Object.keys(names);
    });
}

export function getStatesByProjects(projects: string[], searchWits: string[]): Q.IPromise<string[]> {
    return getWitsByProjects(projects, searchWits).then(wits => {
        const states: { [state: string]: void } = {};
        for (const { transitions } of wits) {
            for (const startState in transitions) {
                if (startState) {
                    states[startState] = undefined;
                }
                for (const { to: targetState } of transitions[startState]) {
                    if (targetState) {
                        states[targetState] = undefined;
                    }
                }
            }
        }
        return Object.keys(states);
    });
}

export const states: CachedValue<string[]> = new CachedValue(getStates);
function getStates() {
    return allProjectWits.getValue().then(witsByProj => {
        const states: { [state: string]: void } = {};
        for (const { workItemTypes } of witsByProj) {
            for (const { transitions } of workItemTypes) {
                for (const startState in transitions) {
                    if (startState) {
                        states[startState] = undefined;
                    }
                    for (const { to: targetState } of transitions[startState]) {
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
        for (const { workItemTypes } of witsByProj) {
            for (const { name } of workItemTypes) {
                wits[name] = undefined;
            }
        }
        return Object.keys(wits);
    });
}
