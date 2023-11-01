import { Cache, NotFound } from "../../cache";
import { RedisClientType } from 'redis';

export class RedisStorage<T> implements Cache<T> {
    constructor(
        private readonly client: RedisClientType,
        private readonly storageName: string
    ) { }

    async get(key: string): Promise<T | NotFound> {
        const valueString = await this.client.get(this.generateKey(key));
        if (!valueString) {
            return new NotFound(key);
        }
        return JSON.parse(valueString);
    }
    async set(key: string, value: T): Promise<void> {
        const valueString = JSON.stringify(value);
        this.client.set(this.generateKey(key), valueString);
    }

    /**
     * @deprecated
     */
    async _cleanStorage() {
        await this.client.flushDb();
    }

    private generateKey(key: string) {
        return `${this.storageName}:${key}`;
    }

}