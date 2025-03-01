"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queue_1 = require("./queue");
const mutex_1 = require("./mutex");
const worker_threads_1 = require("worker_threads");
const queue = new queue_1.Queue();
const mutex = new mutex_1.Mutex();
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
worker_threads_1.parentPort?.on('message', async (task) => {
    const job = {
        id: task,
        execute: async (task_number) => {
            console.log("=======================:", task_number);
        },
        arg: task,
    };
    await mutex.lock();
    queue.enqueue(job);
    mutex.unlock();
});
processQueue();
//# sourceMappingURL=worker.js.map