"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutex = void 0;
class Mutex {
    queue = [];
    locked = false;
    async lock() {
        return new Promise((resolve) => {
            const attemptLock = () => {
                if (!this.locked) {
                    this.locked = true;
                    resolve();
                }
                else {
                    this.queue.push(attemptLock);
                }
            };
            attemptLock();
        });
    }
    unlock() {
        this.locked = false;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next)
                next();
        }
    }
}
exports.Mutex = Mutex;
//# sourceMappingURL=mutex.js.map