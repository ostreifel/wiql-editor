/** Need to implement b/c ie doesn't support */
class IterableIterator<T> {
    constructor(
        public hasNext: () => boolean,
        public next: () => T,
    ) {}
}

function batchGenerator<T>(
    promiseGenerator: IterableIterator<PromiseLike<T>>,
    batchsize: number,
): IterableIterator<PromiseLike<T>[]> {
    return new IterableIterator<PromiseLike<T>[]>(
        () => promiseGenerator.hasNext(),
        () => {
            const arr: PromiseLike<T>[] = [];
            while (promiseGenerator.hasNext()) {
                arr.push(promiseGenerator.next());
                if (arr.length >= batchsize) {
                    return arr;
                }
            }
            return arr;

        }
    );
}
/** It is important to only create the promises as needed by the generator or they will all run at once */
export function throttlePromises<A, T>(arr: A[], convert: (val: A) => PromiseLike<T>, batchsize: number): PromiseLike<T[]> {
    const promiseGenerator = createPromiseGenerator(arr, convert);
    const batcher = batchGenerator(promiseGenerator, batchsize);
    const results: T[] = [];
    return new Promise((resolve, reject) => {
        function queueNext() {
            if (batcher.hasNext()) {
                Promise.all(batcher.next()).then(
                    vals => {
                        results.push(...vals);
                        queueNext();
                    },
                    error => { reject(error); }
                );
            } else {
                resolve(results);
            }
        }
        queueNext();
    });
}

function createPromiseGenerator<A, T>(arr: A[], convert: (val: A) => PromiseLike<T>): IterableIterator<PromiseLike<T>> {
    let idx = 0;
    const a = new IterableIterator<PromiseLike<T>>(
        () => idx < arr.length,
        () => convert(arr[idx++]),
    );
    return a;
}

