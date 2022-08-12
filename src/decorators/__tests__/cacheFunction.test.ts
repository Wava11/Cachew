import { z } from "zod";
import { cacheFunction } from "..";
import { MongoStorageFactory, RunningMongoStorageFactory } from "../../storage/mongo/factory";
import { milliseconds } from "../../utils/time";

describe("safeCacheFunction", () => {
    const connectionString = "mongodb://localhost:27017/test";
    const storageFactory = new MongoStorageFactory({ connectionString });

    let runningStorageFactory: RunningMongoStorageFactory;
    const cacheName = "hi";
    const ttlMs = 300;
    beforeAll(async () => {
        runningStorageFactory = await storageFactory.start();
    });
    beforeEach(async () => {
        await runningStorageFactory._getModel(cacheName)?.deleteMany({});
    });
    afterEach(async () => {
        await milliseconds(0);
        await runningStorageFactory._getModel(cacheName)?.deleteMany({});
    });
    afterAll(async () => {
        runningStorageFactory.stop();
    });
    describe("first invokation", () => {
        const foo = (first: string, second: boolean, third: number) => Promise.resolve(third);
        const functionToCache = jest.fn<ReturnType<typeof foo>, Parameters<typeof foo>>().mockImplementation(foo);
        const argsSchema = z.tuple([z.string(), z.boolean(), z.number()]);
        test("invokes cached function and returns its value", async () => {
            const str = "me";
            const bool = true;
            const num = 23;
            const safelyCached = cacheFunction(cacheName, ttlMs, runningStorageFactory)(argsSchema, (...x) => JSON.stringify(x), functionToCache);

            const result = await safelyCached(str, bool, num);
            expect(functionToCache).toHaveBeenCalledWith(str, bool, num);
            expect(result).toEqual(await foo(str, bool, num));
        });
    });

    describe("immediate second invokation", () => {
        const foo = (first: string, second: boolean, third: number) => Promise.resolve(third);
        const functionToCache = jest.fn<ReturnType<typeof foo>, Parameters<typeof foo>>().mockImplementation(foo);
        const argsSchema = z.tuple([z.string(), z.boolean(), z.number()]);
        test("doesnt invoke cached function and returns the cached value", async () => {
            const str = "me";
            const bool = true;
            const num = 23;
            const safelyCached = cacheFunction(cacheName, ttlMs, runningStorageFactory)(argsSchema, (...x) => JSON.stringify(x), functionToCache);

            await safelyCached(str, bool, num);
            await milliseconds(0);
            const result = await safelyCached(str, bool, num);
            expect(functionToCache).toHaveBeenCalledTimes(1);
            expect(result).toEqual(await foo(str, bool, num));
        });
    });
    describe("second invokation after ttl", () => {
        const foo = (first: string, second: boolean, third: number) => Promise.resolve(third);
        const functionToCache = jest.fn<ReturnType<typeof foo>, Parameters<typeof foo>>().mockImplementation(foo);
        const argsSchema = z.tuple([z.string(), z.boolean(), z.number()]);
        test("invokes cached function and returns the cached value", async () => {
            const str = "me";
            const bool = true;
            const num = 23;
            const safelyCached = cacheFunction(cacheName, ttlMs, runningStorageFactory)(argsSchema, (...x) => JSON.stringify(x), functionToCache);

            await safelyCached(str, bool, num);
            await milliseconds(ttlMs + 100);
            const result = await safelyCached(str, bool, num);
            expect(functionToCache).toHaveBeenCalledTimes(2);
            expect(result).toEqual(await foo(str, bool, num));
        });
    });
});