interface MissHandler {
    handleMiss(key: string): Promise<void>;
}