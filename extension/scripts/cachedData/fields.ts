import { WorkItemField, GetFieldsExpand } from "TFS/WorkItemTracking/Contracts";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";
import { CachedValue } from "./CachedValue";

export const fieldsVal: CachedValue<FieldLookup> = new CachedValue<FieldLookup>(getFieldLookup);

async function getFieldLookup() {
    return new FieldLookup(await getFields());
}

async function getFields(): Promise<WorkItemField[]> {
    const client = getWitClient();
    const getFields: (projectId?: string, expand?: GetFieldsExpand) => IPromise<WorkItemField[]> = client.getFields.bind(client);
    if (getFields.length === 2) {
        return getFields(undefined, GetFieldsExpand.ExtensionFields);
    }
    // Older server -- fallback
    return getWitClient().getFields(GetFieldsExpand && GetFieldsExpand.ExtensionFields as any);
}

export class FieldLookup {
    private static _counter: number = 0;
    private readonly lookup: {[refOrName: string]: WorkItemField} = {};
    public readonly lookupId: number = FieldLookup._counter++;
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
