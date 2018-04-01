import { WebApiTeam } from "TFS/Core/Contracts";
import { getClient } from "TFS/Core/RestClient";

async function getTeamsRest(project: string, top: number, skip: number): Promise<WebApiTeam[]> {
    const client = getClient();
    const get = client.getTeams.bind(client);
    if (get.length === 3) {
        // fallback
        return get(project, top, skip);
    }
    // latest version
    return get(project, false, top, skip);
}

async function hardGetTeams(projName: string) {
    const teams: WebApiTeam[] = [];
    let skip = 0;
    while (true) {
        const batch = await getTeamsRest(projName, 100, skip);
        teams.push(...batch);
        skip += 100;
        if (batch.length < 100) {
            return teams;
        }
    }
}

const teamsMap: {[projName: string]: Promise<WebApiTeam[]>} = {};
export function getTeams(projName: string): Promise<WebApiTeam[]> {
    if (!teamsMap.hasOwnProperty(projName)) {
        teamsMap[projName] = hardGetTeams(projName);
    }
    return teamsMap[projName];
}
