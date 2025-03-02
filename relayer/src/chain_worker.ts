import { Queue } from "./queue";
import { Mutex } from "./mutex";
import { parentPort, Worker } from "worker_threads";
import { MESSAGE_WORKER_FILE } from "./consts";

export interface Job {
    id: number;
    // execute: (arg: any) => Promise<void>;
    arg: any;
}

const queue = new Queue<Job>();
const mutex = new Mutex();
const MAX_THREAD = 4;

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
                // await item.execute(item.arg);
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
        // execute: async ({vaa, vaaBytes})=> {
        //     console.log(`${vaa.emitterChain}:init transaction`);
        //     console.log(`${vaa.emitterChain}:================relay======================`);
        //     console.log(`${vaa.emitterChain}:execute transaction`);
        // },
        arg: {vaa, vaaBytes},
    };
    await mutex.lock();
    queue.enqueue(job);
    mutex.unlock();
});

processQueue();

