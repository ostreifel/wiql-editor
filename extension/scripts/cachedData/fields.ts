import { GetFieldsExpand, WorkItemField } from "TFS/WorkItemTracking/Contracts";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";

import { CachedValue } from "./CachedValue";

export const fieldsVal: CachedValue<FieldLookup> = new CachedValue<FieldLookup>(getFieldLookup);

async function getFieldLookup() {
    return new FieldLookup(await getFields());
}

async function getFields(): Promise<WorkItemField[]> {
    if (getWitClient().getFields.length === 2) {
        return getWitClient().getFields(undefined, GetFieldsExpand.ExtensionFields);
    }
    // Older server -- fallback
    return getWitClient().getFields(GetFieldsExpand && GetFieldsExpand.ExtensionFields as any);
}

export class FieldLookup {
    private static counter: number = 0;
    private readonly lookup: {[refOrName: string]: WorkItemField} = {};
    public readonly lookupId: number = FieldLookup.counter++;
    constructor(public readonly values: WorkItemField[]) {
        for (const field of values) {
            this.lookup[field.referenceName.toLocaleLowerCase()] = field;
            this.lookup[field.name.toLocaleLowerCase()] = field;
        }
    }
    public getField(refOrName: string): WorkItemField | undefined {
        refOrName = refOrName.toLocaleLowerCase();
        return this.lookup[refOrName];
    }
    public equalFields(refOrName1: string, refOrName2: string): boolean {
        const field1 = this.getField(refOrName1);
        const field2 = this.getField(refOrName2);
        return !!field1 && !!field2 && field1.name === field2.name;
    }
}
