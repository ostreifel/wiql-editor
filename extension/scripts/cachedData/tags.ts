import { CachedValue } from "./CachedValue";
import { projects } from "./projects";
import * as Q from "q";
import { callApi } from "../RestCall";

export const allTags: CachedValue<string[]> = new CachedValue(getAllTags);
function getAllTags() {
    return projects.getValue().then(projects =>
        getTagsForProjects(projects.map(p => p.name)
        ));
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
    return Q.all(projectIds.map(p => getTagsForProject(p))).then(tagsArr => {
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

function getTagsForProject(project: string): Q.IPromise<string[]> {
    const webContext = VSS.getWebContext();
    const tagsUrl = webContext.account.uri + "DefaultCollection/_apis/tagging/scopes/" + project + "/tags?api-version=1.0";
    const deferredTags = Q.defer<string[]>();
    callApi(tagsUrl, "GET", undefined, undefined, (tags: ITagsResponse) => {
        deferredTags.resolve(tags.value.map(t => t.name));
    }, (error, errorThrown, status) => {
        deferredTags.reject(error);
    });
    return deferredTags.promise;
}
