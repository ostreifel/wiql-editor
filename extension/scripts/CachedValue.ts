import * as Q from "q";

export class CachedValue<T> {
    private value: T;
    private isValueSet: boolean = false;
    private readonly deferred: Q.Deferred<T>[] = [];
    constructor(private readonly generator: () => Q.IPromise<T>) {}
    public getValue(): Q.IPromise<T> {
        if (this.isValueSet) {
            return Q(this.value);
        }
        const defer = Q.defer<T>();
        if (this.deferred.length === 0) {
            this.generator().then(value => {
                this.value = value;
                this.isValueSet = true;
                for (let promise of this.deferred) {
                    promise.resolve(this.value);
                }
            });
        }
        this.deferred.push(defer);
        return defer.promise;
    }
}
