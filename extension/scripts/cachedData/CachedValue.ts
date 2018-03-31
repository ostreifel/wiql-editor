export class CachedValue<T> {
    private value: T;
    private isValueSet: boolean = false;
    private promise: PromiseLike<T>;
    constructor(private readonly generator: () => PromiseLike<T>) {}
    public async getValue(): Promise<T> {
        if (this.isValueSet) {
            return this.value;
        }
        if (this.promise) {
            this.promise = this.generator();
        }
        this.value = await this.promise;
        this.isValueSet = true;
        return this.value;
    }
    public isLoaded() {
        return this.isValueSet;
    }
}
