import { Cache, NotFound } from ".";
import { z } from 'zod';
import dayjs from 'dayjs';
import { Source } from "../source";

export abstract class TtlCache<T> implements Cache<T> {
    constructor(
        private readonly config: TtlCacheConfig,
        private readonly storage: Cache<TtlEntry<T>>,
        private readonly missHandler: MissHandler<T>
    ) { }

    async get(key: string): Promise<T | NotFound | ExpiredEntry> {
        const fromStorage = await this.storage.get(key);

        if (fromStorage instanceof NotFound) {
            await this.handleMissingEntry(key);
        }
        if (this.isExpired(fromStorage)) {
            return new ExpiredEntry(fromStorage.expiresAt, key);
        }
        return fromStorage.value;
    }

    set(key: string, value: T): Promise<void> {
        throw new Error("Method not implemented.");
    }

    private isExpired(fromStorage: TtlEntry<T>) {
        return dayjs(fromStorage.expiresAt).isBefore(dayjs());
    }
}

export const ttlCacheConfigSchema = z.object({
    ttl: z.number().int()
});
export type TtlCacheConfig = z.infer<typeof ttlCacheConfigSchema>;

interface TtlEntry<T> {
    value: T;
    expiresAt: number;
}

export class ExpiredEntry extends NotFound {
    constructor(public readonly expiredAt: number, key: string) {
        super(key);
    }
}