import { TtlCache } from "..";
import { Cache } from "../..";
import { InMemoryStorage } from "../../../storage/storage.memory";
import { TtlEntry } from "../entry";

describe("TtlCache", () => {
    const someKey = "some key";
    const mockedValue: CachedValue = { myField: [true, false] };
    const missHandler: MissHandler<CachedValue> = { handleMiss: jest.fn().mockResolvedValue(mockedValue) };
    const storage = new InMemoryStorage<TtlEntry<CachedValue>>();
    describe("empty cache", () => {
        describe("get", () => {
            const cache = new TtlCache<CachedValue>({ ttlMs: 3000 }, storage, missHandler);
            test("returns the missHanlder return value", async () => {
                const result = await cache.get(someKey);
                expect(missHandler.handleMiss).toHaveBeenCalledWith(someKey);
                expect(result).toEqual(mockedValue);
            });
        });
        describe("set, get", () => {
            const cache = new TtlCache<CachedValue>({ ttlMs: 3000 }, storage, missHandler);
            test("doesn't invoke the missHandler and returns the set value", async () => {
                await cache.set(someKey, mockedValue);
                const result = await cache.get(someKey);
                expect(missHandler.handleMiss).not.toHaveBeenCalledWith(someKey);
                expect(result).toEqual(mockedValue);
            });
        });
    });
});

interface CachedValue {
    myField: boolean[];
}