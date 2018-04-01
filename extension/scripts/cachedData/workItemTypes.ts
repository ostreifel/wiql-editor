import { TeamProjectReference } from "TFS/Core/Contracts";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";

import { CachedValue } from "./CachedValue";
import { projectsVal } from "./projects";

export interface IProjectWorkItemsTypes {
    project: TeamProjectReference;
    workItemTypes: WorkItemType[];
}
export const allProjectWits: CachedValue<IProjectWorkItemsTypes[]> = new CachedValue(getWits);
async function getWits() {
    const witPromises = (await projectsVal.getValue()).map(async (project) => {
        const workItemTypes = await getWitsByProjects([project.name]);
        return { project, workItemTypes } as IProjectWorkItemsTypes;
    });
    return Promise.all(witPromises);
}

const projectsToWit: { [project: string]: CachedValue<WorkItemType[]> } = {};
export async function getWitsByProjects(projects: string[], searchWits?: string[]): Promise<WorkItemType[]> {
    for (const project of projects) {
        if (!(project in projectsToWit)) {
            projectsToWit[project] = new CachedValue(() => getWitClient().getWorkItemTypes(project));
        }
    }
    const witsArr = await Promise.all(projects.map((p) => projectsToWit[p].getValue()));
    const wits: WorkItemType[] = [];
    for (const arr of witsArr) {
        wits.push(...arr);
    }
    return searchWits ? wits.filter((w) => searchWits.some((w2) => w2 === w.name)) : wits;
}
export async function getWitNamesByProjects(projects: string[]): Promise<string[]> {
    if (projects.length === 0) {
        getWitNames();
    }
    const wits = await getWitsByProjects(projects);
    const names: { [wit: string]: void } = {};
    for (const { name } of wits) {
        names[name] = void 0;
    }
    return Object.keys(names);
}

export async function getStatesByProjects(projects: string[], searchWits: string[]): Promise<string[]> {
    const wits = await getWitsByProjects(projects, searchWits);
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
}

export const statesVal: CachedValue<string[]> = new CachedValue(getStates);
async function getStates() {
    const witsByProj = await allProjectWits.getValue();
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
}

export const witNames: CachedValue<string[]> = new CachedValue(getWitNames);
async function getWitNames() {
    const witsByProj = await allProjectWits.getValue();
    const wits: { [name: string]: void } = {};
    for (const { workItemTypes } of witsByProj) {
        for (const { name } of workItemTypes) {
            wits[name] = undefined;
        }
    }
    return Object.keys(wits);
}
