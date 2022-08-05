import { createClient, RedisClientType } from 'redis';
import { RedisStorage } from '.';
import { Cache } from '../../cache';
import { RunningService, Service } from '../../utils/service';
import { StorageFactory } from '../factory';

export interface RedisStorageFactoryConfig {
    connectionString: string;
}

export class RedisStorageFactory implements Service {
    constructor(private readonly config: RedisStorageFactoryConfig) {

    }
    async start() {
        const client: RedisClientType = createClient({ url: this.config.connectionString });
        await client.connect();
        return new RunningRedisStorageFactory(client);
    }
}

export class RunningRedisStorageFactory implements RunningService, StorageFactory {
    constructor(private readonly client: RedisClientType) { }

    createStorage<T>(storageName: string): RedisStorage<T> {
        return new RedisStorage<T>(this.client, storageName);
    }

    async stop() {
        await this.client.disconnect();
    }
}