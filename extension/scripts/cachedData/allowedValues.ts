import { CachedValue } from "./CachedValue";
import { fields } from "./teamProjects";
import * as Q from "q";
import { callApi } from "../RestCall";

const allAllowedValues: { [fieldId: number]: CachedValue<string[]> } = {};

export function getAllowedValues(refName: string): IPromise<string[]> {
    refName = refName.toLocaleLowerCase();
    return fields.getValue().then(fields => {
        const [field] = fields.filter(f => f.referenceName.toLocaleLowerCase() === refName);
        if (!field) {
            return Q([]);
        }
        if (!(field.id in allAllowedValues)) {
            allAllowedValues[field.id] = new CachedValue(() => getAllowedValuesFromRest(field.id));
        }
        return allAllowedValues[field.id].getValue();
    });
}

function getAllowedValuesFromRest(fieldId: number) {
    const webContext = VSS.getWebContext();
    const url = `${webContext.account.uri}DefaultCollection/_api/_wit/allowedValues?__v=5&fieldId=${fieldId}`;

    const deferredAllowedValues = Q.defer<string[]>();
    callApi(url, "GET", undefined, undefined, (response: { __wrappedArray: string[] }) => {
        Q.resolve(response.__wrappedArray);
    }, (error, errorThrown, status) => {
        deferredAllowedValues.reject(error);
    });
    return deferredAllowedValues.promise;
}
