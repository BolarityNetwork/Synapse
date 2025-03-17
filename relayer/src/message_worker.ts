import { parentPort } from "worker_threads";
import { CHAIN_ID_SEPOLIA, CHAIN_ID_SOLANA, TokenBridgePayload, tryNativeToHexString } from "@certusone/wormhole-sdk";
import {
    RELAYER_SEPOLIA_SECRET_LIST,
    RELAYER_SOLANA_SECRET,
    SEPOLIA_RPC,
    TOKEN_BRIDGE_RELAYER_SEPOLIA_PID, TOKEN_BRIDGE_RELAYER_SOLANA_PID,
    TOKEN_BRIDGE_SOLANA_PID,
} from "./consts";
import { execute_transaction, init_transaction } from "./relayer_hub";
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
    processSepoliaToSolana,
    processSolanaToSepolia,
    processTokenBridgeTransferFromSolana,
    processTokenBridgeTransferWithPayloadFromSepolia,
    processTokenBridgeTransferWithPayloadFromSolana,
} from "./controller";

if (parentPort) {
    parentPort?.on('message', async (message: any) => {
        const { taskId, vaa, vaaBytes,  tokenBridge} = message;

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

        let success = false;
        let signature = "";
        let hash = "";
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
                    [success, hash] = await processTokenBridgeTransferFromSolana(signer, vaaBytes);
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
                    if (tokenBridge.to == rightAlignBuffer(Buffer.from(hexStringToUint8Array(TOKEN_BRIDGE_RELAYER_SEPOLIA_PID)))) {
                        const contractAbi = JSON.parse(
                            require("fs").readFileSync(currentDirectory + "/idl/TokenBridgeRelayer.json", "utf8")
                        );
                        [success, hash] = await processTokenBridgeTransferWithPayloadFromSolana(signer, contractAbi, vaaBytes);
                    }
                } else if(vaa.emitterChain == CHAIN_ID_SEPOLIA) {
                    if (tokenBridge.to.toString("hex")==tokenBridgeRelayerSolana){
                        [success, signature] = await processTokenBridgeTransferWithPayloadFromSepolia(relayerSolanaProgram, vaa, vaaBytes);
                    }
                }
            }
            break;
        }

        let payload = Buffer.from(vaa.payload);
        const payloadMagic = 0xFE;
        // check payload head
        if((payload.length > 8)&& payload[0] == payloadMagic) {
            let fromChain = payload.slice(4,6).readUInt16BE();
            let toChain = payload.slice(6,8).readUInt16BE();

            if((vaa.emitterChain == CHAIN_ID_SEPOLIA) || (vaa.emitterChain == CHAIN_ID_SOLANA) ) {
                // record relay transaction
                // let sequence = await init_transaction(relayerHubProgram, Buffer.from(vaaBytes));

                // let hash_buffer;

                if ((fromChain == CHAIN_ID_SEPOLIA) && (toChain == CHAIN_ID_SOLANA)) {

                    [success, signature] = await processSepoliaToSolana(relayerSolanaProgram, vaa, vaaBytes);
                    // if (signature!= "") {
                    // 	hash_buffer = bs58.decode(signature);
                    // }
                } else if ((fromChain == CHAIN_ID_SOLANA) && (toChain == CHAIN_ID_SEPOLIA)) {
                    const contractAbi = JSON.parse(
                        require("fs").readFileSync(currentDirectory + "/idl/UniProxy.json", "utf8")
                    );
                    [success, hash] = await processSolanaToSepolia(signer, contractAbi, vaaBytes);
                    // hash_buffer = Buffer.from(hexStringToUint8Array(hash));
                }

                // await execute_transaction(relayerHubProgram, sequence, success, hash_buffer);
            }
        }
        parentPort?.postMessage('done');
        process.exit(0)
    });
}