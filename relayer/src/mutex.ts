export class Mutex {
    private queue: (() => void)[] = [];
    private locked: boolean = false;

    async lock(): Promise<void> {
        return new Promise((resolve) => {
            const attemptLock = () => {
                if (!this.locked) {
                    this.locked = true;
                    resolve();
                } else {
                    this.queue.push(attemptLock);
                }
            };
            attemptLock();
        });
    }

    unlock(): void {
        this.locked = false;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) next();
        }
    }
}