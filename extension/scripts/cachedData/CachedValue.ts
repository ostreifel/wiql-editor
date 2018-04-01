export class CachedValue<T> {
    private isValueSet: boolean = false;
    private promise: PromiseLike<T>;
    constructor(private readonly generator: () => PromiseLike<T>) {}
    public async getValue(): Promise<T> {
        if (this.isValueSet) {
            return this.promise;
        }
        if (!this.promise) {
            this.promise = this.generator().then((v) => {
                this.isValueSet = true;
                return v;
            });
        }
        return await this.promise;
    }
    public isLoaded() {
        return this.isValueSet;
    }
}
