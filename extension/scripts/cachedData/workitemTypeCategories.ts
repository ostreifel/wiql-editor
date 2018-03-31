import { CachedValue } from "./CachedValue";
import { WorkItemTypeCategory } from "TFS/WorkItemTracking/Contracts";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { projectsVal } from "./projects";

const categories: {[project: string]: CachedValue<WorkItemTypeCategory[]>} = {};

async function getCategoriesForProject(project: string): Promise<WorkItemTypeCategory[]> {
    if (!(project in categories)) {
        categories[project] = new CachedValue(() => getWitClient().getWorkItemTypeCategories(project));
    }
    return categories[project].getValue();
}

function getCategoriesImpl(projects: string[]) {
    return Promise.all(projects.map(p => getCategoriesForProject(p))).then(categoriesArr => {
        const categories: WorkItemTypeCategory[] = [];
        for (const arr of categoriesArr) {
            categories.push(...arr);
        }
        return categories;
    });
}

export async function getCategories(searchProjects: string[] = []): Promise<WorkItemTypeCategory[]> {
    if (searchProjects.length === 0) {
        return getCategoriesImpl((await projectsVal.getValue()).map(p => p.name));
    }
    return getCategoriesImpl(searchProjects);
}
