import { Cache, NotFound } from "../cache";

export class InMemoryStorage<T> implements Cache<T> {
    private readonly map: Map<string, T>;
    constructor() {
        this.map = new Map();
    }
    async get(key: string): Promise<T | NotFound> {
        return this.map.get(key) ?? new NotFound(key);
    }
    async set(key: string, value: T): Promise<void> {
        this.map.set(key, value);
    }

}