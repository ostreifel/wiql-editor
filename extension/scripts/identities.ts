import * as Q from "q";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import { WebApiTeam } from "TFS/Core/Contracts";
import { getClient } from "TFS/Core/RestClient";

const identityMap: {[displayName: string]: void} = {};
const identities: string[] = [];

function cacheAllIdentitiesInTeam(project: { id: string, name: string }, team: WebApiTeam): IPromise<boolean> {
    identityMap[team.name] = void 0;
    return getClient().getTeamMembers(project.id, team.id).then(members => {
        for (let m of members) {
            const displayName =  m.isContainer ? m.displayName : `${m.displayName} <${m.uniqueName}>`;
            identityMap[displayName] = void 0;
        }
        return true;
    });
}

function cacheAllIdentitiesInProject(project: { id: string, name: string }): IPromise<boolean> {
    return cacheAllIdentitiesInProjectImpl(project, 0);
}
function cacheAllIdentitiesInProjectImpl(project: { id: string, name: string }, skip: number) {
    return getClient().getTeams(project.id, 100, skip).then(teams => {
        const promises = teams.map(t => cacheAllIdentitiesInTeam(project, t));
        if (teams.length === 100) {
            promises.push(cacheAllIdentitiesInProjectImpl(project, skip + 100));
        }
        return Q.all(promises).then(() => true);
    });
}
function cacheAllIdentitiesInAllProjects(): IPromise<boolean> {
    return getClient().getProjects().then(projects =>
        Q.all(projects.map(p => cacheAllIdentitiesInProject(p))).then(
            () => {
                identities.length = 0;
                identities.push(...Object.keys(identityMap).sort());
                return true;
            }
        )
    );
}

export function getIdentities(): Q.IPromise<String[]> {
    if (identities.length > 0) {
        return Q(identities);
    } else {
        return cacheAllIdentitiesInAllProjects().then(() => identities)
    }
}

/** No way to know if identity field from extension api, just hardcode the system ones */
const knownIdentities: string[] = [
    "System.AuthorizedAs",
    "System.ChangedBy",
    "System.AssignedTo",
    "System.CreatedBy",
    "Microsoft.VSTS.Common.ActivatedBy",
    "Microsoft.VSTS.Common.ResolvedBy",
    "Microsoft.VSTS.Common.ClosedBy",
    "Microsoft.VSTS.CodeReview.AcceptedBy",
    "Microsoft.VSTS.Common.ReviewedBy",
    "Microsoft.VSTS.CMMI.SubjectMatterExpert1",
    "Microsoft.VSTS.CMMI.SubjectMatterExpert2",
    "Microsoft.VSTS.CMMI.SubjectMatterExpert3",
    "Microsoft.VSTS.CMMI.CalledBy",
    "Microsoft.VSTS.CMMI.RequiredAttendee1",
    "Microsoft.VSTS.CMMI.RequiredAttendee2",
    "Microsoft.VSTS.CMMI.RequiredAttendee3",
    "Microsoft.VSTS.CMMI.RequiredAttendee4",
    "Microsoft.VSTS.CMMI.RequiredAttendee5",
    "Microsoft.VSTS.CMMI.RequiredAttendee6",
    "Microsoft.VSTS.CMMI.RequiredAttendee7",
    "Microsoft.VSTS.CMMI.RequiredAttendee8",
    "Microsoft.VSTS.CMMI.OptionalAttendee1",
    "Microsoft.VSTS.CMMI.OptionalAttendee2",
    "Microsoft.VSTS.CMMI.OptionalAttendee3",
    "Microsoft.VSTS.CMMI.OptionalAttendee4",
    "Microsoft.VSTS.CMMI.OptionalAttendee5",
    "Microsoft.VSTS.CMMI.OptionalAttendee6",
    "Microsoft.VSTS.CMMI.OptionalAttendee7",
    "Microsoft.VSTS.CMMI.OptionalAttendee8",
    "Microsoft.VSTS.CMMI.ActualAttendee1",
    "Microsoft.VSTS.CMMI.ActualAttendee2",
    "Microsoft.VSTS.CMMI.ActualAttendee3",
    "Microsoft.VSTS.CMMI.ActualAttendee4",
    "Microsoft.VSTS.CMMI.ActualAttendee5",
    "Microsoft.VSTS.CMMI.ActualAttendee6",
    "Microsoft.VSTS.CMMI.ActualAttendee7",
    "Microsoft.VSTS.CMMI.ActualAttendee8",
];
export function isIdentityField(fields: WorkItemField[], refNameOrName: string): boolean {
    refNameOrName = refNameOrName.toLocaleLowerCase();
    const [field] = fields.filter(f => f.name.toLocaleLowerCase() === refNameOrName ||
                                  f.referenceName.toLocaleLowerCase() === refNameOrName);
    if (!field) {
        return false;
    }
    return knownIdentities.indexOf(field.referenceName) >= 0;
}
