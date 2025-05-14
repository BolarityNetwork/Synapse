import { Queue } from "./queue";
import { Mutex } from "./mutex";
import { parentPort, Worker } from "worker_threads";
import { MAX_THREAD, MESSAGE_WORKER_FILE } from "./consts";

export interface Job {
    id: number;
    arg: any;
}

const queue = new Queue<Job>();
const mutex = new Mutex();

async function createNestedWorker(task: any) {
    return new Promise<void>((resolve, reject) => {
        const nestedWorker = new Worker(MESSAGE_WORKER_FILE);
        const { taskId } = task;
        console.log(`=====================================Nested worker ${taskId} created=====================================`);
        nestedWorker.on("message", msg => {
            if (msg.startsWith("done:")) {
                console.log(`Nested worker ${taskId} has completed its task.`);
                parentPort?.postMessage(msg);
                resolve();
            }
        });
        nestedWorker.on("error", error => {
            console.error(`Nested worker ${taskId} error:`, error);
            reject(error);
        });
        nestedWorker.on("exit", code => {
            console.log(`Nested worker ${taskId} stopped with exit code ${code}`);
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
        nestedWorker.postMessage(task);
    });
}

async function processQueue() {
    while (true) {
        await mutex.lock();
        if (!queue.isEmpty()) {
            const promises = [];
            for(let i = 0; i < MAX_THREAD; i++) {
                const item = queue.dequeue();
                if (!item) break; // Break if queue is empty.
                // Allocate a thread to perform message relay.
                const { vaa } = item.arg;
                promises.push(createNestedWorker({ taskId: i, vaa }));
                if (queue.isEmpty()) {
                    break
                }
            }
            try {
                await Promise.all(promises);
            } catch (error) {
                console.error('Error processing task:', error);
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        mutex.unlock();
    }
}

parentPort?.on('message', async (message) => {
    const { vaa } = message;
    const job: Job = {
        id: vaa.emitterChain,
        arg: { vaa },
    };
    await mutex.lock();
    queue.enqueue(job);
    mutex.unlock();
});

processQueue();

