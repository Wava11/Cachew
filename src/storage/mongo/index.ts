
import { Model } from 'mongoose';
import { Cache, NotFound } from "../../cache";


export class MongoStorage<T> implements Cache<T> {

    constructor(private readonly model: Model<MongoStorageEntry<T>>) { };

    async get(key: string): Promise<T | NotFound> {
        const fromCollection = await this.model.findOne({ _id: key });
        return fromCollection?.value ?? new NotFound(key);
    }

    async set(key: string, value: T): Promise<void> {
        await this.model.updateOne({ _id: key }, { value }, { upsert: true });
    }
}

export interface MongoStorageEntry<T> {
    _id: string;
    value: T;
}