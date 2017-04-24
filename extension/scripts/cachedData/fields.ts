import { WorkItemField, GetFieldsExpand } from "TFS/WorkItemTracking/Contracts";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { CachedValue } from "./CachedValue";

export const fields: CachedValue<WorkItemField[]> = new CachedValue<WorkItemField[]>(getFields);

function getFields(): IPromise<WorkItemField[]> {
    const client = getWitClient();
    /** The type definition for fields in the sdk is wrong, this is the actual type if the server is at the latest version */
    const getFields: (projectId?: string, expand?: GetFieldsExpand) => IPromise<WorkItemField[]> = <any>client.getFields.bind(client);
    if (getFields.length === 2) {
        return getFields(undefined, GetFieldsExpand.ExtensionFields);
    }
    // Older server -- fallback
    return this.getWitClient().getFields(GetFieldsExpand.ExtensionFields)
}

export function getField(refOrName: string, fields: WorkItemField[]): WorkItemField | undefined {
    refOrName = refOrName.toLocaleLowerCase();
    const [field] = fields.filter(f => f.name.toLocaleLowerCase() === refOrName || f.referenceName.toLocaleLowerCase() === refOrName);
    return field;
}
export function equalFields(refOrName1: string, refOrName2: string, fields: WorkItemField[]): boolean {
    const field1 = getField(refOrName1, fields);
    const field2 = getField(refOrName2, fields);
    return !!field1 && !!field2 && field1.name === field2.name;
}