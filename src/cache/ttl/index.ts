import time from 'dayjs';
import { Cache, NotFound } from "..";
import { TtlCacheConfig } from './config';
import { ExpiredEntry } from './errors';
import { TtlEntry } from './entry';
import { MissHandler } from '../../miss.handler';
import { Source } from '../../source';

export class TtlCache<T> implements Cache<T> {
    constructor(
        private readonly config: TtlCacheConfig,
        private readonly storage: Cache<TtlEntry<T>>,
        private readonly source: Source<T>
    ) { }

    async get(key: string): Promise<T | NotFound | ExpiredEntry> {
        const fromStorage = await this.storage.get(key);

        if (fromStorage instanceof NotFound) {
            const fromSource = await this.updateCache(key);
            return fromSource;
        }
        if (this.isExpired(fromStorage)) {
            this.updateCache(key);
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

    private async updateCache(key: string) {
        const fromSource = await this.source.get(key);
        this.set(key, fromSource);
        return fromSource;
    }

    private isExpired(fromStorage: TtlEntry<T>) {
        return time(fromStorage.expiresAt).isBefore(time());
    }
}