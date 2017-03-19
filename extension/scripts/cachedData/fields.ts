import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { CachedValue } from "./CachedValue";

export const fields: CachedValue<WorkItemField[]> = new CachedValue(() => getWitClient().getFields());

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