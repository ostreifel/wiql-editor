import { callApi } from "../RestCall";
import { CachedValue } from "./CachedValue";
import { projectsVal } from "./projects";

export const allTagsVal: CachedValue<string[]> = new CachedValue(getAllTags);
async function getAllTags() {
    return await getTagsForProjects((await projectsVal.getValue()).map((p) => p.name));
}

const tagsMap: { [projectId: string]: CachedValue<string[]> } = {};
export function getTagsForProjects(projectIds: string[]) {
    if (projectIds.length === 0) {
        return allTagsVal.getValue();
    }
    for (const projectId of projectIds) {
        if (!(projectId in tagsMap)) {
            tagsMap[projectId] = new CachedValue(() => getTagsForProject(projectId));
        }
    }
    return Promise.all(projectIds.map((p) => getTagsForProject(p))).then((tagsArr) => {
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
    for (const ref of await projectsVal.getValue()) {
        if (ref.name.toLocaleLowerCase() === project.toLocaleLowerCase()) {
            project = ref.id;
            break;
        }
    }

    const webContext = VSS.getWebContext();
    let tagsUrl = webContext.account.uri;
    if (!tagsUrl.match(/DefaultCollection/i)) {
        tagsUrl += "DefaultCollection/";
    }
    tagsUrl += "_apis/tagging/scopes/" + project + "/tags?api-version=1.0";
    return new Promise<string[]>((resolve, reject) => {
        callApi(tagsUrl, "GET", undefined, undefined, (tags: ITagsResponse) => {
            resolve(tags.value.map((t) => t.name));
        }, reject);
    });
}
