import { TtlCache } from "../cache/ttl";
import { TtlEntry } from "../cache/ttl/entry";
import { StorageFactory } from "../storage/factory";
import { Source } from '../source';
import { z } from "zod";


// TODO: connection between args schema type and `P`
export const cacheFunction = (cacheName: string, ttlMs: number, storage: StorageFactory) =>
    <P extends unknown[], ArgsSchemaType extends z.ZodTuple<any>, R>(argumentsSchema: ArgsSchemaType, argsToKey: (...args: z.infer<ArgsSchemaType>) => string, functionToCache: CachableFunction<P, R>): CachableFunction<P, R> => {
        const source = functionToSource(argumentsSchema, functionToCache);
        const cache = new TtlCache({ ttlMs }, storage.createStorage<TtlEntry<R>>(cacheName), source);
        return (...args: z.infer<ArgsSchemaType>): Promise<R> =>
            cache.get(argsToKey(...args));
    };

export const unsafeCacheFunction = (cacheName: string, ttlMs: number, storage: StorageFactory) =>
    <P extends unknown[], R>(functionToCache: CachableFunction<P, R>): CachableFunction<P, R> => {
        const source: Source<R> = { get: key => functionToCache(...JSON.parse(key)) };
        const cache = new TtlCache({ ttlMs }, storage.createStorage<TtlEntry<R>>(cacheName), source);
        return (...args: P): Promise<R> =>
            cache.get(JSON.stringify(args));
    };

interface CachableFunction<P extends unknown[], R> {
    (...args: P): Promise<R>;
}

const functionToSource = <P extends unknown[], ArgsSchemaType extends z.ZodTuple<any>, R>(
    argsSchema: ArgsSchemaType,
    func: CachableFunction<P, R>
): Source<R> => ({
    get: (key) => func(
        ...argsSchema.parse(
            JSON.parse(key)
        ) as P
    )
});