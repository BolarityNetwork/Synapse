import {
    RedisConnectionOpts,
    RedisStorage,
    RelayerApp,
    sleep,
    StandardRelayerAppOpts,
} from "@wormhole-foundation/relayer-engine";
import { Cluster, Redis } from "ioredis";
import { createPool, Pool } from "generic-pool";
import { number } from "yargs";
import { MissedVaaOpts } from "@wormhole-foundation/relayer-engine/lib/cjs/relayer/middleware/missedVaasV3/worker";

export class MessageStorage {
    private readonly pool: Pool<Redis | Cluster>;
    private readonly prefix: string;

    constructor(
        app: RelayerApp<any>,
        opts: StandardRelayerAppOpts
    ) {
        this.pool = this.createRedisPool(opts);
        this.prefix = (app.storage as RedisStorage).getPrefix();
        spawnMsgStorageWorker(app, opts, this);
    }

    get redisPool() {
        return this.pool;
    }

    createRedisPool(opts: RedisConnectionOpts): Pool<Redis | Cluster> {
        const factory = {
            create: async function () {
                const redis = opts.redisCluster
                    ? new Redis.Cluster(opts.redisClusterEndpoints!, opts.redisCluster)
                    : new Redis(opts.redis!);
                // TODO: metrics.missed_vaa_redis_open_connections.inc();
                return redis;
            },
            destroy: async function (redis: Redis | Cluster) {
                // TODO: metrics.missed_vaa_redis_open_connections.dec();
            },
        };
        const poolOpts = {
            min: 5,
            max: 15,
            autostart: true,
        };
        return createPool(factory, poolOpts);
    }

    getMsgSequenceKey(
        prefix: string,
        emitterChain: number,
        emitterAddress: string,
    ): string {
        return `${prefix}:msgSequence:${emitterChain}:${emitterAddress}`;
    }

    async pushVaaToMsgQueue(
        emitterChain: number,
        emitterAddress: string,
        sequence: string,
        vaaBytes: string,
    ): Promise<void> {
        const seenVaaKey = this.getMsgSequenceKey(this.prefix, emitterChain, emitterAddress);

        await this.redisPool.use(
            async redis => {
                try {
                    redis.hset(seenVaaKey, sequence, vaaBytes);
                } catch (error) {
                    console.log(`Set vaa bytes from message queue error: ${error}`);
                }
            }
        );
    }

    async popVaaFromMsgQueue(
        emitterChain: number,
        emitterAddress: string,
        sequence: string,
    ): Promise<string> {
        const seenVaaKey = this.getMsgSequenceKey(this.prefix, emitterChain, emitterAddress);
        let vaaBytes = "";
        await this.redisPool.use(
            async redis => {
                try {
                    vaaBytes = await redis.hget(seenVaaKey, sequence);
                } catch (error) {
                    console.log(`Got vaa bytes from message queue error: ${error}`);
                } finally {
                    redis.hdel(seenVaaKey, sequence);
                }
            }
        );
        return vaaBytes
    }

    async seekAllVaaFromMsgQueue(
        emitterChain: number,
        emitterAddress: string,
    ): Promise<string[]> {
        const seenVaaKey = this.getMsgSequenceKey(this.prefix, emitterChain, emitterAddress);
        let vaaBytes :string[]= [];
        await this.redisPool.use(
            async redis => {
                try {
                    vaaBytes = await redis.hkeys(seenVaaKey);
                } catch (error) {
                    console.log(`Got vaa bytes from message queue error: ${error}`);
                }
            }
        );
        return vaaBytes
    }
}


export async function mapConcurrent(
    arr: any[],
    fn: (...args: any[]) => Promise<any>,
    concurrency: number = 5,
) {
    const pendingArgs = [...arr];
    async function evaluateNext() {
        if (pendingArgs.length === 0) return;
        const args = pendingArgs.shift();
        await fn(args);
        // If any pending promise is resolved, then evaluate next
        await evaluateNext();
    }
    // Promises that will be executed parallely, with a maximum of `concurrency` at a time
    const promises = new Array(concurrency).fill(0).map(evaluateNext);
    await Promise.all(promises);
}
export async function spawnMsgStorageWorker(
    app: RelayerApp<any>,
    opts: MissedVaaOpts,
    msgStorage: MessageStorage,
): Promise<void> {
    if (!app.filters.length) {
        console.log(
            "Message storage Worker: Not found, retrying in 100ms...",
        );
        setTimeout(() => {
            spawnMsgStorageWorker(app, opts, msgStorage);
        }, 1000);
        return;
    }

    const filters = app.filters.map(filter => {
        return {
            emitterChain: filter.emitterFilter!.chainId,
            emitterAddress: filter.emitterFilter!.emitterAddress,
        };
    });
    while (true) {
        console.log(`======================Message storage process ...===========================`);
        await mapConcurrent(filters, async filter => {
                let messages = await msgStorage.seekAllVaaFromMsgQueue(filter.emitterChain, filter.emitterAddress);

                for (const sequence of messages) {
                    let value ="";
                    try {
                        value = await msgStorage.popVaaFromMsgQueue(filter.emitterChain, filter.emitterAddress, sequence);
                    } catch (error) {
                        console.log(
                            `Error getting last safe sequence for chain: `,
                            error,
                        );
                    }
                    console.log(value);
                }
            },
        );
        await sleep(opts.checkInterval || 5_000);
    }
}