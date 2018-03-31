import { CachedValue } from "./CachedValue";
import { projectsVal } from "./projects";
import { callApi } from "../RestCall";

export const allTags: CachedValue<string[]> = new CachedValue(getAllTags);
async function getAllTags() {
    return await getTagsForProjects((await projectsVal.getValue()).map(p => p.name));
}

const tagsMap: { [projectId: string]: CachedValue<string[]> } = {};
export function getTagsForProjects(projectIds: string[]) {
    if (projectIds.length === 0) {
        return allTags.getValue();
    }
    for (const projectId of projectIds) {
        if (!(projectId in tagsMap)) {
            tagsMap[projectId] = new CachedValue(() => getTagsForProject(projectId));
        }
    }
    return Promise.all(projectIds.map(p => getTagsForProject(p))).then(tagsArr => {
        const allTags: { [tag: string]: void } = {};
        for (const tags of tagsArr) {
            for (const tag of tags) {
                allTags[tag] = undefined;
            }
        }
        return Object.keys(allTags);
    });
}

interface ITagsResponse {
    count: number;
    value: ITag[];
}
interface ITag {
    id: string;
    name: string;
    active: boolean;
    url: string;
}

async function getTagsForProject(project: string): Promise<string[]> {
    const webContext = VSS.getWebContext();
    const tagsUrl = webContext.account.uri + "DefaultCollection/_apis/tagging/scopes/" + project + "/tags?api-version=1.0";
    return new Promise<string[]>((resolve, reject) => {
        callApi(tagsUrl, "GET", undefined, undefined, (tags: ITagsResponse) => {
            resolve(tags.value.map(t => t.name));
        }, (error, errorThrown, status) => {
            reject(error);
        });
    });
}
