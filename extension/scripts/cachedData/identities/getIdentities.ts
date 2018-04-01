import { WebApiTeam } from "TFS/Core/Contracts";
import { getClient } from "TFS/Core/RestClient";
import { IdentityRef, TeamMember } from "VSS/WebApi/Contracts";
import { CachedValue } from "../CachedValue";
import * as ExtensionCache from "./extensionCache";
import { throttlePromises } from "./throttlePromises";

interface ITeamIdentities {
    team: IdentityRef;
    members: IdentityRef[];
}
interface IProjectIdentities {
    id: string;
    name: string;
    teams: ITeamIdentities[];
}

async function hardGetAllIdentitiesInTeam(project: { id: string, name: string }, team: WebApiTeam): Promise<ITeamIdentities> {
    const teamIdentity = <IdentityRef> { displayName: `[${project.name}]\\${team.name}`, id: team.id, isContainer: true };
    const members = await getClient().getTeamMembersWithExtendedProperties(project.id, team.id);
    const teamIdentities: ITeamIdentities = {
        team: teamIdentity,
        members: members.map((m) => m.identity),
    };
    return teamIdentities;
}

async function hardGetAllIdentitiesInProject(proj: { id: string, name: string }): Promise<IProjectIdentities> {
    async function hardGetAllIdentitiesInProjectImpl(project: { id: string, name: string }, skip: number): Promise<IProjectIdentities> {
        const teamIds = await getClient().getTeams(project.id, false, 100, skip);
        const teamPromises = throttlePromises(teamIds, (t) => hardGetAllIdentitiesInTeam(project, t), 10) as Promise<ITeamIdentities[]>;
        let moreTeamsPromise: Promise<IProjectIdentities | null> = Promise.resolve(null);
        if (teamIds.length === 100) {
            moreTeamsPromise = hardGetAllIdentitiesInProjectImpl(project, skip + 100);
        }

        const [teams, moreTeams] = await Promise.all([teamPromises, moreTeamsPromise]);
        return {
            id: project.id,
            name: project.name,
            teams: [...teams, ...(moreTeams ? moreTeams.teams : [])],
        };
    }
    return hardGetAllIdentitiesInProjectImpl(proj, 0);
}

async function hardGetAllIdentitiesInAllProjects(): Promise<IProjectIdentities[]> {
    const projects = await getClient().getProjects();
    return Promise.all(projects.map((p) => hardGetAllIdentitiesInProject(p)));
}

const identityMap: { [key: string]: CachedValue<IdentityRef[]> } = {};
const identitiesKey = "identities";
export async function getIdentities(project?: { id: string, name: string }): Promise<IdentityRef[]> {
    const key = `${identitiesKey}-${project ? project.name : ""}`;
    if (key in identityMap) {
        return identityMap[key].getValue();
    }
    async function tryGetIdentities() {
        function toIdentityArr(projects: IProjectIdentities[]): IdentityRef[] {
            const idMap: { [id: string]: IdentityRef } = {};
            for (const { teams } of projects) {
                for (const {team, members} of teams) {
                    idMap[team.id] = team;
                    for (const member of members) {
                        idMap[member.id] = member;
                    }
                }
            }
            return Object.keys(idMap).map((id) => idMap[id]);
        }
        const identities = await ExtensionCache.get<IProjectIdentities[]>(key);
        if (identities) {
            return toIdentityArr(identities);
        }
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + 7);
        if (project) {
            const projectIdents = await hardGetAllIdentitiesInProject(project);
            ExtensionCache.store(key, [projectIdents]);
            return toIdentityArr([projectIdents]);
        } else {
            const projectIdents = await hardGetAllIdentitiesInAllProjects();
            ExtensionCache.store(key, projectIdents);
            return toIdentityArr(projectIdents);
        }
    }
    if (!(key in identityMap)) {
        identityMap[key] = new CachedValue(tryGetIdentities);
    }
    return identityMap[key].getValue();
}
