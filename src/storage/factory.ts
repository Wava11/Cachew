import { Cache } from "../cache";

export interface StorageFactory {
    createStorage<T>(storageName: string): Cache<T>;
}