import Redis from 'ioredis';
import {LogStorage, MsgLog} from "./log_storage";
const winston = require('winston');
require('winston-daily-rotate-file');

function formatTimestamp(timestamp: string): string {
    const timestampNumber = Number(timestamp);

    const date = new Date(timestampNumber);

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };

    return date.toLocaleString('zh-CN', options);
}
const transport = new winston.transports.DailyRotateFile({
    dirname: 'logs',
    filename: 'log-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH-mm',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        transport,
        new winston.transports.Console()
    ]
});

const readFromRedis = async (logStorage:LogStorage) => {

    let empty = await logStorage.isEmpty();
    if(!empty) {
        let data:MsgLog = await logStorage.popLogMsg();
        if(data != undefined) {
            console.log("==================================================================");
            console.log("tx hash:           " + data.tx_hash);
            console.log("submit time:       " + formatTimestamp(data.timestamp));
            console.log("executed tx hash:  " + data.intent_tx_hash);
            console.log("executed time:     " + formatTimestamp(data.intent_timestamp));
            console.log("latency time:      " + (Number(data.intent_timestamp) - Number(data.timestamp)) + " ms");
            console.log("==================================================================");
        }
    }
};


// const writeToRedis = async (logStorage:LogStorage) => {
//     await logStorage.pushLogMsg("111", Date.now().toString(), "222", Date.now().toString());
// };

const logStorage = new LogStorage();

setInterval(() => {readFromRedis(logStorage)}, 5000);
// setInterval(() => {writeToRedis(logStorage)}, 5000);

process.on('SIGINT', () => {
    logger.info('Shutdown server...');
    process.exit();
});