import { getClient as getWitClient } from "TFS/WorkItemTracking/RestClient";

import { CachedValue } from "./CachedValue";

export const relationTypes = new CachedValue(getRelationTypes);

function getRelationTypes() {
    return getWitClient().getRelationTypes();
}
