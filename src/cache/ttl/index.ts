import time from 'dayjs';
import { Cache, NotFound } from "..";
import { Source } from '../../source';
import { TtlCacheConfig } from './config';
import { TtlEntry } from './entry';
import { ExpiredEntry } from './errors';

// TODO: add source error handling and monitoring
export class TtlCache<CachedValue> implements Cache<CachedValue> {
    constructor(
        private readonly config: TtlCacheConfig,
        private readonly storage: Cache<TtlEntry<CachedValue>>,
        private readonly source: Source<CachedValue>
    ) { }

    async get(key: string): Promise<CachedValue> {
        const fromStorage = await this.storage.get(key);
        
        if (fromStorage instanceof NotFound) {
            const fromSource = await this.updateCache(key);
            return fromSource;
        }
        if (this.isExpired(fromStorage)) {
            this.updateCache(key);
        }
        return fromStorage.value;
    }


    async set(key: string, value: CachedValue): Promise<void> {
        await this.storage.set(key, {
            expiresAt: this.calculateExpiry(),
            value
        });
    }

    private calculateExpiry(): number {
        return time().add(this.config.ttlMs, "milliseconds").valueOf();
    }

    // TODO: CQS
    private async updateCache(key: string) {
        const fromSource = await this.source.get(key);
        this.set(key, fromSource);
        return fromSource;
    }

    private isExpired(fromStorage: TtlEntry<CachedValue>) {
        return time(fromStorage.expiresAt).isBefore(time());
    }
}