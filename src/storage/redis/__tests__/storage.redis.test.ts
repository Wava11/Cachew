import { RedisStorage } from '..';
import { NotFound } from '../../../cache';
import { RedisStorageFactory, RunningRedisStorageFactory } from '../factory';


interface Data {
    someField: string[];
}

const connectionString = "redis://localhost:6379";
const storageName = "my_entity";

describe("RedisStorage", () => {
    const someKey = "some key";
    const otherKey = "other key";

    const someValue: Data = {
        someField: ["hi", "hey"]
    };
    const otherValue: Data = {
        someField: ["bye", "ciao"]
    };

    const factory = new RedisStorageFactory({ connectionString });
    let runningFactory: RunningRedisStorageFactory;
    let storage: RedisStorage<Data>;

    beforeAll(async () => {
        runningFactory = await factory.start();
        storage = runningFactory.createStorage<Data>(storageName);
    });
    afterAll(async () => {
        await runningFactory.stop();
    });
    beforeEach(async () => {
        await storage._cleanStorage();
    });
    afterEach(async () => {
        await storage._cleanStorage();
    });

    describe("set", () => {
        describe("key is not in redis", () => {
            test("sets key in redis", async () => {
                await storage.set(someKey, someValue);

                const fromStorage = await storage.get(someKey);
                expect(fromStorage).toEqual(someValue);
            });
        });

        describe("key IS in redis", () => {
            test("updates value", async () => {
                await storage.set(someKey, someValue);
                await storage.set(someKey, otherValue);

                const fromStorage = await storage.get(someKey);
                expect(fromStorage).toEqual(otherValue);
            });
        });
    });
    describe("get", () => {
        describe("key is not in redis", () => {
            test("returns NotFound", async () => {
                const fromStorage = await storage.get(someKey);
                expect(fromStorage).toBeInstanceOf(NotFound);
            });
            describe("other key IS in redis", () => {
                test("returns NotFound", async () => {
                    await storage.set(someKey, someValue);
                    const fromStorage = await storage.get(otherKey);
                    expect(fromStorage).toBeInstanceOf(NotFound);
                });
            });
        });
        describe("key IS in redis", () => {
            test("returns value field of document", async () => {
                await storage.set(someKey, someValue);
                const fromStorage = await storage.get(someKey);
                expect(fromStorage).toEqual(someValue);
            });
        });

    });
});

