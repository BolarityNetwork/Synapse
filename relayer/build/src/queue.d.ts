export declare class Queue<T> {
    private items;
    enqueue(item: T): void;
    dequeue(): T | undefined;
    isEmpty(): boolean;
    size(): number;
}
