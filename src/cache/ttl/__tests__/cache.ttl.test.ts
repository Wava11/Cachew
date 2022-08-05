import { TtlCache } from "..";
import { Source } from "../../../source";
import { InMemoryStorage } from "../../../storage/memory";
import { milliseconds } from "../../../utils/time";
import { TtlEntry } from "../entry";

describe("TtlCache", () => {
    const someKey = "some key";
    const otherKey = "other key";
    const mockedValue: CachedValue = { myField: [true, false] };
    const sourceResponse: CachedValue = { myField: [false] };
    const source: Source<CachedValue> = { get: jest.fn().mockResolvedValue(sourceResponse) };
    const storage = new InMemoryStorage<TtlEntry<CachedValue>>();
    describe("empty cache", () => {
        describe("get", () => {
            const storageSetSpy = jest.spyOn(storage, "set");
            const cache = new TtlCache<CachedValue>({ ttlMs: 3000 }, storage, source);
            test("returns the source return value and updates storage", async () => {
                const result = await cache.get(someKey);

                const expectedStorageEntry: TtlEntry<CachedValue> = {
                    expiresAt: expect.anything(),
                    value: sourceResponse
                };
                expect(source.get).toHaveBeenCalledWith(someKey);
                expect(result).toEqual(sourceResponse);
                expect(storageSetSpy).toHaveBeenCalledWith(someKey, expectedStorageEntry);
            });
        });
        describe("cache has one value", () => {
            describe("getting the key present in the cache", () => {
                const cache = new TtlCache<CachedValue>({ ttlMs: 3000 }, storage, source);
                test("doesn't invoke the source and returns the set value", async () => {
                    await cache.set(someKey, mockedValue);
                    const result = await cache.get(someKey);
                    expect(source.get).not.toHaveBeenCalledWith(someKey);
                    expect(result).toEqual(mockedValue);
                });
            });
            describe("getting a key NOT present in the cache", () => {
                const cache = new TtlCache<CachedValue>({ ttlMs: 3000 }, storage, source);
                test("invokes the source and returns source return value", async () => {
                    const result = await cache.get(otherKey);
                    expect(source.get).toHaveBeenCalledWith(otherKey);
                    expect(result).toEqual(sourceResponse);
                });
            });
            describe("setting the value", () => {
                const storageSetSpy = jest.spyOn(storage, "set");
                const cache = new TtlCache<CachedValue>({ ttlMs: 3000 }, storage, source);
                test("updates the expiry time", async () => {
                    await cache.set(someKey, mockedValue);
                    await milliseconds(200);
                    await cache.set(someKey, mockedValue);
                    const [firstStorageSetCall, secondStorageSetCall] = storageSetSpy.mock.calls;
                    expect(secondStorageSetCall[1].expiresAt).toBeGreaterThan(firstStorageSetCall[1].expiresAt);
                });
            });
        });
        describe("cache has expired value", () => {
            const ttlMs = 300;
            describe("getting the expired value", () => {
                const cache = new TtlCache<CachedValue>({ ttlMs }, storage, source);
                test("invokes the source and returns cached, expired value", async () => {
                    await cache.set(someKey, mockedValue);
                    await milliseconds(ttlMs + 100);
                    const result = await cache.get(someKey);
                    expect(source.get).toHaveBeenCalledWith(someKey);
                    expect(result).toEqual(mockedValue);
                });
            });
        });
    });
});

interface CachedValue {
    myField: boolean[];
}