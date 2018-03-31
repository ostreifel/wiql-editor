import { CachedValue } from "./CachedValue";
import { getClient } from "TFS/Core/RestClient";
import { TeamProjectReference } from "TFS/Core/Contracts";
import * as Q from "q";

export const projects: CachedValue<TeamProjectReference[]> = new CachedValue(getProjects);

async function getProjects(skip = 0): Promise<TeamProjectReference[]> {
    return getClient().getProjects(undefined, 100, skip).then(projects => {
        if (projects.length === 100) {
            return getProjects(skip + 100).then(proj2 => [...projects, ...proj2]);
        }
        return projects;
    });
}
