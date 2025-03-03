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
    return new Promise<any>((resolve, reject) => {
        const worker = new Worker(MESSAGE_WORKER_FILE);

        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
        worker.postMessage(task)
    });
}

async function processQueue() {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await mutex.lock();
        if (!queue.isEmpty()) {
            for(let i = 0; i < MAX_THREAD; i++) {
                const item = queue.dequeue();
                // Allocate a thread to perform message relay.
                const { vaa, vaaBytes } = item.arg;
                await createNestedWorker({ taskId:i, vaa, vaaBytes });
                if (queue.isEmpty()) {
                    break
                }
            }
        }
        mutex.unlock();
    }
}

parentPort?.on('message', async (message) => {
    const { vaa, vaaBytes } = message;
    const job: Job = {
        id: vaa.emitterChain,
        arg: {vaa, vaaBytes},
    };
    await mutex.lock();
    queue.enqueue(job);
    mutex.unlock();
});

processQueue();

