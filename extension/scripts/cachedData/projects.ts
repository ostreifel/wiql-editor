import { CachedValue } from "./CachedValue";
import { getClient } from "TFS/Core/RestClient";
import { TeamProjectReference } from "TFS/Core/Contracts";

export const projectsVal: CachedValue<TeamProjectReference[]> = new CachedValue(getProjects);

async function getProjects(skip = 0): Promise<TeamProjectReference[]> {
    const projects: TeamProjectReference[] = [];
    while (true) {
        const batch = await getClient().getProjects(undefined, 100, skip);
        projects.push(...batch);
        if (batch.length !== 100) {
            break;
        }
        skip += 100;
    }
    return projects;
}
