export interface MissHandler<T> {
    handleMiss(key: string): Promise<T>;
}