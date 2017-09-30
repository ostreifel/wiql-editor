import * as Q from "q";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import { WebApiTeam } from "TFS/Core/Contracts";
import { getClient } from "TFS/Core/RestClient";
import { CachedValue } from "./CachedValue";
import { FieldLookup } from "./fields";
import { getIdentities } from "./identities/getIdentities";

export const identities: CachedValue<string[]> = new CachedValue(getIdentityStrings);

function getIdentityStrings(): Q.IPromise<string[]> {
    return getIdentities().then((identities) =>
        identities.map((m) => m.isContainer ?
            m.displayName :
            `${m.displayName} <${m.uniqueName}>`
        ),
    )
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
export function isIdentityField(fields: FieldLookup, refNameOrName: string): boolean {
    const field = fields.getField(refNameOrName);
    if (!field) {
        return false;
    }
    // Use the new field flag to detect if identity when available
    // this is the only way to detect if custom fields are identity fields
    return field["isIdentity"] || knownIdentities.indexOf(field.referenceName) >= 0;
}
