import { Cluster, Redis } from "ioredis";
import { createPool, Pool } from "generic-pool";

export interface MsgLog {
    tx_hash: string;
    timestamp: string;
    intent_tx_hash: string;
    intent_timestamp: string;
}

function encodeMsgLog(msgLog: MsgLog): string {
    try {
        return JSON.stringify(msgLog);
    } catch (error) {
        return "";
    }

}

function decodeMsgLog(encoded: string): MsgLog | undefined {
    try {
        const obj = JSON.parse(encoded);

        return {
            tx_hash: obj.tx_hash,
            timestamp: obj.timestamp,
            intent_tx_hash: obj.intent_tx_hash,
            intent_timestamp: obj.intent_timestamp,
        };
    } catch (error) {
        return undefined;
    }
}

export class LogStorage {
    private readonly pool: Pool<Redis | Cluster>;

    constructor(
    ) {
        this.pool = this.createRedisPool();

    }
    createRedisPool(): Pool<Redis | Cluster> {
        const factory = {
            create: async function () {
                const redis = new Redis();
                return redis;
            },
            destroy: async function (redis: Redis | Cluster) {
            },
        };
        const poolOpts = {
            min: 5,
            max: 15,
            autostart: true,
        };
        return createPool(factory, poolOpts);
    }

    get redisPool() {
        return this.pool;
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

    async popLogMsg(
    ): Promise<any> {
        const logMsgKey = this.getLogMsgKey();
        let msg;
        await this.redisPool.use(
            async redis => {
                try {
                    let value = await redis.lpop(logMsgKey);
                    if(value != null) {
                        msg =  decodeMsgLog(value);
                    }
                } catch (error) {
                    console.error(`record error: ${error}`);
                }
            }
        );
        return msg;
    }

    async isEmpty(
    ): Promise<boolean> {
        const logMsgKey = this.getLogMsgKey();
        let empty = false;
        await this.redisPool.use(
            async redis => {
                let len = await redis.llen(logMsgKey);
                empty =  len == 0;
            }
        );
        return empty;
    }
}