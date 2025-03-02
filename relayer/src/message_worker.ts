import { parentPort, Worker } from "worker_threads";
import { Job } from "./chain_worker";
import { CHAIN_ID_SEPOLIA, CHAIN_ID_SOLANA } from "@certusone/wormhole-sdk";
import { RELAYER_SEPOLIA_SECRET_LIST } from "./consts";


parentPort?.on('message', async (message:any) => {
    const { taskId, vaa, vaaBytes } = message;

    if(vaa.emitterChain == CHAIN_ID_SEPOLIA) {
        // Solana can process in parallel with one account.
        console.log(`${vaa.emitterChain}, ${taskId}:================init transaction======================`);
        setTimeout(() => {
            console.log(`${vaa.emitterChain}, ${taskId}:================relay======================`);
        }, 1000);
        console.log(`${vaa.emitterChain}, ${taskId}:================execute transaction======================`);
    } else if(vaa.emitterChain == CHAIN_ID_SOLANA) {
        // EVM needs to switch between multiple accounts
        console.log(`${vaa.emitterChain}, ${taskId},${RELAYER_SEPOLIA_SECRET_LIST[taskId]}:================relay======================`);
    }
    parentPort?.postMessage('done');
});