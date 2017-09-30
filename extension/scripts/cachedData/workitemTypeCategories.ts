import { CachedValue } from "./CachedValue";
import { WorkItemTypeCategory } from "TFS/WorkItemTracking/Contracts";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { projects } from "./projects";
import * as Q from "q";


const categories: {[project: string]: CachedValue<WorkItemTypeCategory[]>} = {};

function getCategoriesForProject(project: string): Q.IPromise<WorkItemTypeCategory[]> {
    if (!(project in categories)) {
        categories[project] = new CachedValue(() => getWitClient().getWorkItemTypeCategories(project));
    }
    return categories[project].getValue();
}

function getCategoriesImpl(projects: string[]) {
    return Q.all(projects.map(p => getCategoriesForProject(p))).then(categoriesArr => {
        const categories: WorkItemTypeCategory[] = [];
        for (const arr of categoriesArr) {
            categories.push(...arr);
        }
        return categories;
    });
}

export function getCategories(searchProjects: string[] = []): Q.IPromise<WorkItemTypeCategory[]> {
    if (searchProjects.length === 0) {
        return projects.getValue().then((projects): Q.IPromise<WorkItemTypeCategory[]> => getCategoriesImpl(projects.map(p => p.name)));
    }
    return getCategoriesImpl(searchProjects);
}
