import { parentPort, Worker } from "worker_threads";
import { Job } from "./chain_worker";
import { CHAIN_ID_SEPOLIA, CHAIN_ID_SOLANA } from "@certusone/wormhole-sdk";
import { RELAYER_SEPOLIA_SECRET, RELAYER_SEPOLIA_SECRET_LIST, RELAYER_SOLANA_SECRET, SEPOLIA_RPC } from "./consts";
import { execute_transaction, init_transaction } from "./relayer_hub";
import { Program } from "@coral-xyz/anchor";
import { ethers } from "ethers";
import { getSolanaConnection, getSolanaProgram, hexStringToUint8Array } from "./utils";
import { Keypair } from "@solana/web3.js";
import * as bs58 from "bs58";
import { processSepoliaToSolana, processSolanaToSepolia } from "./controller";


parentPort?.on('message', async (message:any) => {
    const { taskId, vaa, vaaBytes } = message;
    const connection = getSolanaConnection();
    const currentDirectory = process.cwd();

    const relayerSolanaKeypair = Keypair.fromSecretKey(bs58.decode(RELAYER_SOLANA_SECRET));
    const relayerSolanaProgram = getSolanaProgram(connection, relayerSolanaKeypair, currentDirectory + "/idl/solana.json");

    const relayerHubProgram = getSolanaProgram(connection, relayerSolanaKeypair, currentDirectory + "/idl/relayer_hub.json");
    // init sepolia connection
    const signer = new ethers.Wallet(RELAYER_SEPOLIA_SECRET, new ethers.providers.JsonRpcProvider(SEPOLIA_RPC));
    const contractAbi = JSON.parse(
        require("fs").readFileSync(currentDirectory + "/idl/UniProxy.json", "utf8")
    );

    if((vaa.emitterChain == CHAIN_ID_SEPOLIA) || (vaa.emitterChain == CHAIN_ID_SOLANA) ) {
        // record relay transaction
        let sequence = await init_transaction(connection, relayerHubProgram, Buffer.from(vaaBytes), relayerSolanaKeypair);
        let success = false;
        let hash_buffer;
        let hash;
        if (vaa.emitterChain == CHAIN_ID_SEPOLIA) {
        	let signature;
        	[success, signature] = await processSepoliaToSolana(connection, relayerSolanaProgram, relayerSolanaKeypair, vaa, vaaBytes);
        	if (signature!= "") {
        		hash_buffer = bs58.decode(signature);
        	}
        } else if (vaa.emitterChain == CHAIN_ID_SOLANA) {
        	[success, hash] = await processSolanaToSepolia(signer, contractAbi, vaaBytes);
        	hash_buffer = Buffer.from(hexStringToUint8Array(hash));
        }

        await execute_transaction(connection, relayerHubProgram, sequence, success, relayerSolanaKeypair, hash_buffer);
    }
    parentPort?.postMessage('done');
});