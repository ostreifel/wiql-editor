import { CachedValue } from "./CachedValue";
import { projects } from "./projects";
import * as Q from "q";
import { callApi } from "../RestCall";

export const tags: CachedValue<string[]> = new CachedValue(getTags);
function getTags() {
    return projects.getValue().then(projects => {
        return Q.all(projects.map(p => getTagsForProject(p.id))).then(tagsArr => {
            const allTags: string[] = [];
            for (let tags of tagsArr) {
                allTags.push(...tags);
            }
            return allTags;
        });
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

function getTagsForProject(project: string) {
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
