export interface Cache<T> {
    get(key: string): Promise<T | NotFound>;
    set(key: string, value: T): Promise<void>;
}

export class NotFound extends Error {
    constructor(public readonly key: string) {
        super("entry not found");
    }
}