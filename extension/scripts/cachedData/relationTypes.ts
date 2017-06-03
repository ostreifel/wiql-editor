import { CachedValue } from "./CachedValue";
import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";

export const relationTypes = new CachedValue(getRelationTypes);

function getRelationTypes() {
    return getWitClient().getRelationTypes();
}
