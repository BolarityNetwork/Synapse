import { Queue } from "./queue";
import { Mutex } from "./mutex";
import { parentPort } from "worker_threads";

export interface Job {
    id: number;
    execute: (arg: any) => Promise<void>;
    arg: any;
}

const queue = new Queue<Job>();
const mutex = new Mutex();

async function processQueue() {
    while (true) {
        await mutex.lock();
        if (!queue.isEmpty()) {
            console.log(queue);
            const item = queue.dequeue();
            await item.execute(item.arg);
        }
        mutex.unlock();
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

parentPort?.on('message', async (task:number) => {
    const job: Job = {
        id: task,
        execute: async (task_number:number)=> {
            console.log("=======================:", task_number);
        },
        arg: task,
    };
    await mutex.lock();
    queue.enqueue(job);
    mutex.unlock();
});

processQueue();

