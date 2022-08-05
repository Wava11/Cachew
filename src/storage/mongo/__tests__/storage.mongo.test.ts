import mongoose, { model, Schema } from 'mongoose';
import { MongoStorage, MongoStorageEntry } from '..';
import { NotFound } from '../../../cache';


interface Data {
    someField: string[];
}
const dataMongooseSchema = {
    someField: [String]
};

const connectionString = "mongodb://localhost:27017/test";
const modelName = "my_entity";

describe("MongoStorage", () => {
    const someKey = "some key";
    const otherKey = "other key";

    const someValue: Data = {
        someField: ["hi", "hey"]
    };
    const otherValue: Data = {
        someField: ["bye", "ciao"]
    };

    const dataModel = model<MongoStorageEntry<Data>>(modelName, new Schema({ _id: String, value: dataMongooseSchema }));
    const storage = new MongoStorage<Data>(dataModel);

    beforeAll(async () => {
        await mongoose.connect(connectionString);
    });
    beforeEach(async () => {
        await dataModel.deleteMany({});
    });
    afterEach(async () => {
        await dataModel.deleteMany({});
    });
    afterAll(async () => {
        await mongoose.disconnect();
    });
    describe("set", () => {
        describe("key is not in collection", () => {
            test("creates new document", async () => {
                await storage.set(someKey, someValue);

                const fromCollection = await dataModel.find({}).lean();
                expect(fromCollection).toHaveLength(1);
                expect(fromCollection[0]._id).toEqual(someKey);
                expect(fromCollection[0].value).toEqual(someValue);
            });
        });

        describe("key IS in collection", () => {
            test("updates document", async () => {
                await storage.set(someKey, someValue);
                await storage.set(someKey, otherValue);

                const fromCollection = await dataModel.find({}).lean();
                expect(fromCollection).toHaveLength(1);
                expect(fromCollection[0]._id).toEqual(someKey);
                expect(fromCollection[0].value).toEqual(otherValue);
            });
        });
    });
    describe("get", () => {
        describe("key is not in collection", () => {
            test("returns NotFound", async () => {
                const fromStorage = await storage.get(someKey);
                expect(fromStorage).toBeInstanceOf(NotFound);
            });
            describe("other key IS in collection", () => {
                test("returns NotFound", async () => {
                    await storage.set(someKey, someValue);
                    const fromStorage = await storage.get(otherKey);
                    expect(fromStorage).toBeInstanceOf(NotFound);
                });
            });
        });
        describe("key IS in collection", () => {
            test("returns value field of document", async () => {
                await storage.set(someKey, someValue);
                const fromStorage = await storage.get(someKey);
                expect(fromStorage).toEqual(someValue);
            });
        });

    });
});

