import { parentPort } from "worker_threads";
import {
    CHAIN_ID_BASE_SEPOLIA,
    CHAIN_ID_SEPOLIA,
    CHAIN_ID_SOLANA, parseTokenTransferPayload,
    TokenBridgePayload,
    tryNativeToHexString,
} from "@certusone/wormhole-sdk";
import {
    BASE_SEPOLIA_RPC,
    RELAYER_BASE_SEPOLIA_SECRET_LIST,
    RELAYER_SEPOLIA_SECRET_LIST,
    RELAYER_SOLANA_SECRET,
    SEPOLIA_RPC, TOKEN_BRIDGE_BASE_SEPOLIA_PID,
    TOKEN_BRIDGE_RELAYER_SEPOLIA_PID, TOKEN_BRIDGE_RELAYER_SOLANA_PID, TOKEN_BRIDGE_SEPOLIA_PID,
    TOKEN_BRIDGE_SOLANA_PID,
} from "./consts";
import { init_execute_transaction } from "./relayer_hub";
import { ethers } from "ethers";
import {
    getSolanaConnection,
    getSolanaProgram,
    getSolanaProvider,
    hexStringToUint8Array,
    rightAlignBuffer,
} from "./utils";
import { Keypair } from "@solana/web3.js";
import * as bs58 from "bs58";
import {
    processSepoliaToSolana, processSolanaToBaseSepolia,
    processSolanaToSepolia,
    processTokenBridgeTransferFromSolana,
    processTokenBridgeTransferWithPayloadFromSepolia,
    processTokenBridgeTransferWithPayloadFromSolana,
} from "./controller";

if (parentPort) {
    parentPort?.on('message', async (message: any) => {
        const { taskId, vaa } = message;
        const vaaBytes = vaa.bytes;
        let tokenBridge;
        try {
            tokenBridge =  parseTokenTransferPayload(Buffer.from(vaa.payload));
        } catch (error) {
            console.log(error)
        }


        const relayerSolanaKeypair = Keypair.fromSecretKey(bs58.decode(RELAYER_SOLANA_SECRET));

        const connection = getSolanaConnection();
        const provider = getSolanaProvider(connection, relayerSolanaKeypair);
        const currentDirectory = process.cwd();

        const relayerSolanaProgram = getSolanaProgram(currentDirectory + "/idl/relayer_solana.json", provider);

        const relayerHubProgram = getSolanaProgram(currentDirectory + "/idl/relayer_hub.json", provider);
        // init sepolia connection
        let index = Number(taskId)%RELAYER_SEPOLIA_SECRET_LIST.length;
        let privateKey = RELAYER_SEPOLIA_SECRET_LIST[index];
        const signer = new ethers.Wallet(privateKey, new ethers.providers.JsonRpcProvider(SEPOLIA_RPC));
        // init base sepolia connection
        index = Number(taskId)%RELAYER_BASE_SEPOLIA_SECRET_LIST.length;
        privateKey = RELAYER_BASE_SEPOLIA_SECRET_LIST[index];
        const baseSigner = new ethers.Wallet(privateKey, new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC));

        let success = false;
        let signature = "";
        let hash = "";
        let hash_buffer;
        const tokenBridgeRelayerSolana = tryNativeToHexString(
            TOKEN_BRIDGE_RELAYER_SOLANA_PID,
            CHAIN_ID_SOLANA
        );
        // Token bridge message.
        switch (tokenBridge?.payloadType) {
            case TokenBridgePayload.Transfer: {
                console.log(
                    `Transfer processing for: \n` +
                    `\tToken: ${tokenBridge.tokenChain}:${tokenBridge.tokenAddress.toString(
                        "hex",
                    )}\n` +
                    `\tAmount: ${tokenBridge.amount}\n` +
                    `\tReceiver: ${tokenBridge.toChain}:${tokenBridge.to.toString("hex")}\n`,
                );
                if (vaa.emitterChain == CHAIN_ID_SOLANA) {
                    let contract = TOKEN_BRIDGE_SEPOLIA_PID;
                    if(tokenBridge.toChain == CHAIN_ID_BASE_SEPOLIA) {
                        contract = TOKEN_BRIDGE_BASE_SEPOLIA_PID;
                    }
                    [success, hash] = await processTokenBridgeTransferFromSolana(signer, vaaBytes, contract);
                    hash_buffer = Buffer.alloc(64);
                    let sourceBuffer = Buffer.from(hexStringToUint8Array(hash));
                    sourceBuffer.copy(hash_buffer, 32, 0, sourceBuffer.length);
                    await init_execute_transaction(relayerHubProgram,
                        vaa.emitterChain, Buffer.from(vaa.emitterAddress), vaa.sequence, success, hash_buffer);
                }
            }
            break;
            case TokenBridgePayload.TransferWithPayload: {
                console.log(
                    `Transfer processing for: \n` +
                    `\tToken: ${tokenBridge.tokenChain}:${tokenBridge.tokenAddress.toString(
                        "hex",
                    )}\n` +
                    `\tAmount: ${tokenBridge.amount}\n` +
                    `\tSender ${tokenBridge.fromAddress?.toString("hex")}\n` +
                    `\tReceiver: ${tokenBridge.toChain}:${tokenBridge.to.toString("hex")}\n` +
                    `\tPayload: ${tokenBridge.tokenTransferPayload.toString("hex")}\n`,
                );
                if (vaa.emitterChain == CHAIN_ID_SOLANA) {
                    if (Buffer.from(tokenBridge.to).equals(rightAlignBuffer(Buffer.from(hexStringToUint8Array(TOKEN_BRIDGE_RELAYER_SEPOLIA_PID))))) {
                        const contractAbi = JSON.parse(
                            require("fs").readFileSync(currentDirectory + "/idl/TokenBridgeRelayer.json", "utf8")
                        );
                        [success, hash] = await processTokenBridgeTransferWithPayloadFromSolana(signer, contractAbi, vaaBytes);
                        hash_buffer = Buffer.alloc(64);
                        let sourceBuffer = Buffer.from(hexStringToUint8Array(hash));
                        sourceBuffer.copy(hash_buffer, 32, 0, sourceBuffer.length);
                        await init_execute_transaction(relayerHubProgram,
                            vaa.emitterChain, Buffer.from(vaa.emitterAddress), vaa.sequence, success, hash_buffer);
                    }
                } else if(vaa.emitterChain == CHAIN_ID_SEPOLIA) {
                    if (Buffer.from(tokenBridge.to).toString("hex")==tokenBridgeRelayerSolana){
                        [success, signature] = await processTokenBridgeTransferWithPayloadFromSepolia(relayerSolanaProgram, vaa, vaaBytes);
                        if (signature!= "") {
                            hash_buffer = bs58.decode(signature);
                        }
                        await init_execute_transaction(relayerHubProgram,
                            vaa.emitterChain, Buffer.from(vaa.emitterAddress), vaa.sequence, success, hash_buffer);
                    }
                }
            }
            break;
        }

        let payload = Buffer.from(vaa.payload);
        const payloadMagic = 0xFE;
        // check payload head
        if((payload.length > 8)&& payload[0] == payloadMagic) {
            try {
                let fromChain = payload.slice(4,6).readUInt16BE();
                let toChain = payload.slice(6,8).readUInt16BE();

                if((vaa.emitterChain == CHAIN_ID_SEPOLIA) || (vaa.emitterChain == CHAIN_ID_SOLANA) || (vaa.emitterChain == CHAIN_ID_BASE_SEPOLIA)) {
                    // record relay transaction

                    if ((fromChain == CHAIN_ID_SEPOLIA) && (toChain == CHAIN_ID_SOLANA)) {

                        [success, signature] = await processSepoliaToSolana(relayerSolanaProgram, vaa, vaaBytes);
                        if (signature!= "") {
                            hash_buffer = bs58.decode(signature);
                        }
                    } else if ((fromChain == CHAIN_ID_SOLANA) && (toChain == CHAIN_ID_SEPOLIA)) {
                        const contractAbi = JSON.parse(
                            require("fs").readFileSync(currentDirectory + "/idl/UniProxy.json", "utf8")
                        );
                        [success, hash] = await processSolanaToSepolia(signer, contractAbi, vaaBytes);
                        hash_buffer = Buffer.alloc(64);
                        let sourceBuffer = Buffer.from(hexStringToUint8Array(hash));
                        sourceBuffer.copy(hash_buffer, 32, 0, sourceBuffer.length);
                    } else if ((fromChain == CHAIN_ID_BASE_SEPOLIA) && (toChain == CHAIN_ID_SOLANA)) {

                        [success, signature] = await processSepoliaToSolana(relayerSolanaProgram, vaa, vaaBytes);
                        if (signature!= "") {
                            hash_buffer = bs58.decode(signature);
                        }
                    } else if ((fromChain == CHAIN_ID_SOLANA) && (toChain == CHAIN_ID_BASE_SEPOLIA)) {
                        const contractAbi = JSON.parse(
                            require("fs").readFileSync(currentDirectory + "/idl/UniProxy.json", "utf8")
                        );
                        [success, hash] = await processSolanaToBaseSepolia(baseSigner, contractAbi, vaaBytes);
                        hash_buffer = Buffer.alloc(64);
                        let sourceBuffer = Buffer.from(hexStringToUint8Array(hash));
                        sourceBuffer.copy(hash_buffer, 32, 0, sourceBuffer.length);
                    }

                    await init_execute_transaction(relayerHubProgram,
                        vaa.emitterChain, Buffer.from(vaa.emitterAddress), vaa.sequence, success, hash_buffer);
                }
            } catch (error) {
                console.log(`Process cross chain message error:${error}`);
            }

        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        let emitterAddress = Buffer.from(vaa.emitterAddress).toString('hex');
        let doneMessage = `done:${vaa.emitterChain}:${emitterAddress}:${String(vaa.sequence)}`
        parentPort?.postMessage(doneMessage);
        process.exit(0)
    });
}