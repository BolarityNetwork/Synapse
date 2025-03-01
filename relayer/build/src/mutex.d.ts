export declare class Mutex {
    private queue;
    private locked;
    lock(): Promise<void>;
    unlock(): void;
}
