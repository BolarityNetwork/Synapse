import { parentPort } from "worker_threads";
import { CHAIN_ID_SEPOLIA, CHAIN_ID_SOLANA } from "@certusone/wormhole-sdk";
import { RELAYER_SEPOLIA_SECRET_LIST, RELAYER_SOLANA_SECRET, SEPOLIA_RPC } from "./consts";
import { execute_transaction, init_transaction } from "./relayer_hub";
import { ethers } from "ethers";
import { getSolanaConnection, getSolanaProgram, getSolanaProvider, hexStringToUint8Array } from "./utils";
import { Keypair } from "@solana/web3.js";
import * as bs58 from "bs58";
import { processSepoliaToSolana, processSolanaToSepolia } from "./controller";


parentPort?.on('message', async (message:any) => {
    const { taskId, vaa, vaaBytes } = message;
    const relayerSolanaKeypair = Keypair.fromSecretKey(bs58.decode(RELAYER_SOLANA_SECRET));

    const connection = getSolanaConnection();
    const provider = getSolanaProvider(connection, relayerSolanaKeypair);
    const currentDirectory = process.cwd();

    const relayerSolanaProgram = getSolanaProgram(currentDirectory + "/idl/relayer_solana.json", provider);

    const relayerHubProgram = getSolanaProgram(currentDirectory + "/idl/relayer_hub.json", provider);
    // init sepolia connection
    var index = Number(taskId)%RELAYER_SEPOLIA_SECRET_LIST.length;
    const privateKey = RELAYER_SEPOLIA_SECRET_LIST[index];
    const signer = new ethers.Wallet(privateKey, new ethers.providers.JsonRpcProvider(SEPOLIA_RPC));
    const contractAbi = JSON.parse(
        require("fs").readFileSync(currentDirectory + "/idl/UniProxy.json", "utf8")
    );

    if((vaa.emitterChain == CHAIN_ID_SEPOLIA) || (vaa.emitterChain == CHAIN_ID_SOLANA) ) {
        // record relay transaction
        // let sequence = await init_transaction(relayerHubProgram, Buffer.from(vaaBytes));
        let success = false;
        // let hash_buffer;
        let hash;
        if (vaa.emitterChain == CHAIN_ID_SEPOLIA) {
        	let signature;
        	[success, signature] = await processSepoliaToSolana(relayerSolanaProgram, vaa, vaaBytes);
        	// if (signature!= "") {
        	// 	hash_buffer = bs58.decode(signature);
        	// }
        } else if (vaa.emitterChain == CHAIN_ID_SOLANA) {
        	[success, hash] = await processSolanaToSepolia(signer, contractAbi, vaaBytes);
        	// hash_buffer = Buffer.from(hexStringToUint8Array(hash));
        }

        // await execute_transaction(relayerHubProgram, sequence, success, hash_buffer);
    }
    parentPort?.postMessage('done');
});