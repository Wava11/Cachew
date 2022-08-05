export interface Source<T> {
    get(key: string): Promise<T>;
}