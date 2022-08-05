import time from 'dayjs';
import { Cache, NotFound } from "..";
import { TtlCacheConfig } from './config';
import { ExpiredEntry } from './errors';
import { TtlEntry } from './entry';

export class TtlCache<T> implements Cache<T> {
    constructor(
        private readonly config: TtlCacheConfig,
        private readonly storage: Cache<TtlEntry<T>>,
        private readonly missHandler: MissHandler<T>
    ) { }

    async get(key: string): Promise<T | NotFound | ExpiredEntry> {
        const fromStorage = await this.storage.get(key);

        if (fromStorage instanceof NotFound) {
            return this.missHandler.handleMiss(key);
        }
        if (this.isExpired(fromStorage)) {
            this.missHandler.handleMiss(key);
            return fromStorage.value;
        }
        return fromStorage.value;
    }

    async set(key: string, value: T): Promise<void> {
        await this.storage.set(key, {
            expiresAt: time().add(this.config.ttlMs, "milliseconds").valueOf(),
            value: value
        });
    }

    private isExpired(fromStorage: TtlEntry<T>) {
        return time(fromStorage.expiresAt).isBefore(time());
    }
}


