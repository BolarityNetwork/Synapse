import { parseVaaWithBytes, RelayerApp, sleep, StandardRelayerAppOpts } from "@wormhole-foundation/relayer-engine";
import { MissedVaaOpts } from "@wormhole-foundation/relayer-engine/lib/cjs/relayer/middleware/missedVaasV3/worker";
import { getSolanaConnection, getSolanaProgram, getSolanaProvider, mapConcurrent } from "./utils";
import { Program } from "@coral-xyz/anchor";
import { RelayerHub } from "../types/relayer_hub";
import { number } from "yargs";
import { check_tx_exist, get_un_executed_sequence } from "./relayer_hub";
import { Keypair } from "@solana/web3.js";
import * as bs58 from "bs58";
import { RELAYER_SOLANA_SECRET } from "./consts";
import { decodeTokenTransfer } from "./encode_decode";
import { workers } from "./app";
import { parseTokenTransferPayload } from "@certusone/wormhole-sdk";
import { MessageStorage } from "./message_storage";


export class MessageScan {

    private readonly storage: MessageStorage;

    constructor(
        app: RelayerApp<any>,
        opts: StandardRelayerAppOpts,
        storage: MessageStorage,
    ) {
        this.storage = storage;
        spawnMsgScanWorker(app, opts, this);
    }

    get getStorage() {
        return this.storage;
    }
}

export async function spawnMsgScanWorker(
    app: RelayerApp<any>,
    opts: MissedVaaOpts,
    msgScan: MessageScan,
): Promise<void> {
    if (!app.filters.length) {
        console.log(
            "Message scan Worker: Not found, retrying in 1000ms...",
        );
        setTimeout(() => {
            spawnMsgScanWorker(app, opts, msgScan);
        }, 1000);
        return;
    }

    const filters = app.filters.map(filter => {
        return {
            emitterChain: filter.emitterFilter!.chainId,
            emitterAddress: filter.emitterFilter!.emitterAddress,
        };
    });
    const relayerSolanaKeypair = Keypair.fromSecretKey(bs58.decode(RELAYER_SOLANA_SECRET));
    const connection = getSolanaConnection();
    const provider = getSolanaProvider(connection, relayerSolanaKeypair);
    const currentDirectory = process.cwd();
    const relayerHubProgram = getSolanaProgram(currentDirectory + "/idl/relayer_hub.json", provider);

    while (true) {
        console.log(`======================Message scan process ...===========================`);
        await mapConcurrent(filters, async filter => {
                const emitterChain = filter.emitterChain;
                const emitterAddress = filter.emitterAddress;
                // Get not executed sequence
                const sequence = await get_un_executed_sequence(relayerHubProgram, emitterChain, Buffer.from(emitterAddress));
                // End sequence.
                const end_sequence = await msgScan.getStorage.tryGetLastSafeSequence(emitterChain, Buffer.from(emitterAddress).toString(`hex`));
                console.log(`Emitter chain:${emitterChain}, Emitter address: ${emitterAddress}`);
                console.log(`Process sequence: ${sequence}`);
                // Check if the transaction exists.
                const exist = await check_tx_exist(relayerHubProgram, emitterChain, Buffer.from(emitterAddress),Number(sequence));
                if(exist) {
                    // TODO:
                    return;
                }
                // Get raw vaa through wormhole api.
                try {
                    let vaa = await app.fetchVaa(emitterChain, emitterAddress, BigInt(sequence));

                    const workerData = workers.find(w => w.workerId === filter.emitterChain);
                    if(workerData != undefined) {
                        workerData.worker.postMessage({ vaa });
                    }
                } catch (error) {
                    console.error(error);
                }
                // TODO:In what cases should the code be skipped?
            },
        );
        await sleep(opts.checkInterval || 500_000);
    }
}