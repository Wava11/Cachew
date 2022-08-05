export interface Service {
    start(): Promise<RunningService>;
}
export interface RunningService {
    stop(): Promise<void>;
}