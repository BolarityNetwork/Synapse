import {
    parseVaaWithBytes,
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
import { tryGetLastSafeSequence } from "@wormhole-foundation/relayer-engine/lib/cjs/relayer/middleware/missedVaasV3/storage";
import { workers } from "./app";
import { hexStringToUint8Array, mapConcurrent } from "./utils";
import { decodeTokenTransfer, encodeTokenTransfer } from "./encode_decode";

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

    getMsgProcessKey(
        prefix: string,
        emitterChain: number,
        emitterAddress: string,
        sequence: string,
    ): string {
        return `${prefix}:msgProcess:${emitterChain}:${emitterAddress}:${sequence}`;
    }

    getMsgProcessKeyPattern(
        prefix: string,
    ): string {
        return `${prefix}:msgProcess:*`;
    }


    async pushVaaToMsgQueue(
        emitterChain: number,
        emitterAddress: string,
        sequence: string,
        vaaBytes: string,
    ): Promise<void> {
        const msgSequenceKey = this.getMsgSequenceKey(this.prefix, emitterChain, emitterAddress);

        await this.redisPool.use(
            async redis => {
                try {
                    redis.hset(msgSequenceKey, sequence, vaaBytes);
                } catch (error) {
                    console.log(`Set vaa bytes from message queue error: ${error}`);
                }
            }
        );
    }

    async getMessageProcessing(
        emitterChain: number,
        emitterAddress: string,
        sequence: string,
    ): Promise<string> {
        const msgSequenceKey = this.getMsgProcessKey(this.prefix, emitterChain, emitterAddress, sequence);
        let value ="";
        await this.redisPool.use(
            async redis => {
                try {
                    value = await redis.get(msgSequenceKey);
                } catch (error) {
                    console.log(`Set message process error: ${error}`);
                }
            }
        );
        return value;
    }
    async setMessageProcessing(
        emitterChain: number,
        emitterAddress: string,
        sequence: string,
    ): Promise<void> {
        const msgSequenceKey = this.getMsgProcessKey(this.prefix, emitterChain, emitterAddress, sequence);

        await this.redisPool.use(
            async redis => {
                try {
                    redis.set(msgSequenceKey, sequence);
                } catch (error) {
                    console.log(`Set message process error: ${error}`);
                }
            }
        );
    }

    async clearMessageProcessing(
        emitterChain: number,
        emitterAddress: string,
        sequence: string,
    ): Promise<void> {
        const msgSequenceKey = this.getMsgProcessKey(this.prefix, emitterChain, emitterAddress, sequence);

        await this.redisPool.use(
            async redis => {
                try {
                    redis.del(msgSequenceKey, sequence);
                } catch (error) {
                    console.log(`Set message process error: ${error}`);
                }
            }
        );
    }

    async clearAllMessageProcessing(
    ): Promise<void> {
        const msgSequenceKeyPattern = this.getMsgProcessKeyPattern(this.prefix);

        await this.redisPool.use(
            async redis => {
                try {
                    let cursor = '0';

                    do {
                        const results = await redis.scan(cursor, 'MATCH', msgSequenceKeyPattern);
                        cursor = results[0];
                        const keys = results[1];

                        if (keys.length > 0) {
                            await redis.del(...keys);
                            console.log(`Deleted keys: ${keys.join(', ')}`);
                        }
                    } while (cursor !== '0');
                } catch (error) {
                    console.log(`Clear all message process error: ${error}`);
                }
            }
        );
    }
    async popVaaFromMsgQueue(
        emitterChain: number,
        emitterAddress: string,
        sequence: string,
    ): Promise<string> {
        const msgSequenceKey = this.getMsgSequenceKey(this.prefix, emitterChain, emitterAddress);
        let vaaBytes = "";
        await this.redisPool.use(
            async redis => {
                try {
                    vaaBytes = await redis.hget(msgSequenceKey, sequence);
                } catch (error) {
                    console.log(`Got vaa bytes from message queue error: ${error}`);
                }
            }
        );
        return vaaBytes
    }

    async discardVaaFromMsgQueue(
        emitterChain: number,
        emitterAddress: string,
        sequence: string,
    ): Promise<void> {
        const msgSequenceKey = this.getMsgSequenceKey(this.prefix, emitterChain, emitterAddress);
        await this.redisPool.use(
            async redis => {
                try {
                    redis.hdel(msgSequenceKey, sequence);
                } catch (error) {
                    console.log(`Discard message error: ${error}`);
                }
            }
        );
    }

    async seekAllVaaFromMsgQueue(
        emitterChain: number,
        emitterAddress: string,
    ): Promise<string[]> {
        const msgSequenceKey = this.getMsgSequenceKey(this.prefix, emitterChain, emitterAddress);
        let vaaBytes :string[]= [];
        await this.redisPool.use(
            async redis => {
                try {
                    vaaBytes = await redis.hkeys(msgSequenceKey);
                } catch (error) {
                    console.log(`Got vaa bytes from message queue error: ${error}`);
                }
            }
        );
        return vaaBytes
    }

    async tryGetLastSafeSequence(
        emitterChain: number,
        emitterAddress: string,
    ): Promise<bigint | undefined> {
        let sequence = BigInt(0);
        await this.redisPool.use(
            async redis => {
                try {
                    sequence = await tryGetLastSafeSequence(redis, this.prefix, emitterChain, emitterAddress);
                } catch (error) {
                    console.log(`Got last safe sequence error: ${error}`);
                }
            }
        );
        return sequence;
    }

    getLogMsgKey(
    ): string {
        return `relayer-metrics:message`;
    }

    async pushLogMsg(
        tx_hash: string,
        timestamp: string,
        intent_tx_hash: string,
        intent_timestamp: string,
    ): Promise<void> {
        const logMsgKey = this.getLogMsgKey();

        await this.redisPool.use(
            async redis => {
                try {
                    const msgLog = JSON.stringify({
                        'tx_hash': tx_hash,
                        'timestamp': timestamp,
                        'intent_tx_hash': intent_tx_hash,
                        'intent_timestamp': intent_timestamp,
                    });
                    redis.rpush(logMsgKey, msgLog)
                } catch (error) {
                    console.error(`record error: ${error}`);
                }
            }
        );
    }
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
                    console.log(`Got message from redis,now process.....`);
                    let value ="";
                    try {
                        let flag = await msgStorage.getMessageProcessing(filter.emitterChain, filter.emitterAddress, sequence);
                        if(flag==sequence) {
                            console.log(`The message is being processed, so skip .....`);
                            continue;
                        }
                        await msgStorage.setMessageProcessing(filter.emitterChain, filter.emitterAddress, sequence);
                        value = await msgStorage.popVaaFromMsgQueue(filter.emitterChain, filter.emitterAddress, sequence);
                    } catch (error) {
                        console.log(
                            `Error process message: `,
                            error,
                        );
                    }
                    console.log(value);
                    const workerData = workers.find(w => w.workerId === filter.emitterChain);
                    if(workerData != undefined) {
                        let parsedVaa = hexStringToUint8Array(value);
                        let vaa = parseVaaWithBytes(parsedVaa);
                        workerData.worker.postMessage({vaa});
                    }
                }
            },
        );
        await sleep(opts.checkInterval || 5_000);
    }
}