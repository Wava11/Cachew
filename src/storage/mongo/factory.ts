import mongoose, { Model, model, Schema } from 'mongoose';
import { MongoStorage, MongoStorageEntry } from '.';
import { Service, RunningService } from '../../utils/service';
import { StorageFactory } from '../factory';

export interface MongoStorageFactoryConfig {
    connectionString: string;
}

export class MongoStorageFactory implements Service {
    constructor(private readonly config: MongoStorageFactoryConfig) {

    }
    async start() {
        await mongoose.connect(this.config.connectionString);
        return new RunningMongoStorageFactory();
    }
}

export class RunningMongoStorageFactory implements RunningService, StorageFactory {
    private readonly models: Record<string, Model<any>> = {};

    constructor() { }

    createStorage<T>(storageName: string): MongoStorage<T> {
        if (storageName in this.models) {
            return new MongoStorage(this.models[storageName]);
        }
        const storageModel = model<MongoStorageEntry<T>>(storageName, new Schema({ _id: String }, { strict: false }));
        this.models[storageName] = storageModel;
        return new MongoStorage(storageModel);
    }

    /**
     * 
     * @deprecated
     */
    _getModel(storageName: string) {
        return this.models[storageName];
    }

    async stop() {
        await mongoose.disconnect();
    }
}