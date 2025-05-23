import {
	defaultLogger,
	Environment, mergeDeep, parseVaaWithBytes,
	StandardRelayerApp, StandardRelayerAppOpts,
	StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import {
	Keypair, PublicKey,
} from "@solana/web3.js";
import {
	CHAIN_ID_SOLANA, CHAIN_ID_SEPOLIA, tryNativeToHexString, TokenBridgePayload, CHAIN_ID_BASE_SEPOLIA, parseVaa,
} from "@certusone/wormhole-sdk";
import {
	RELAYER_SOLANA_SECRET,
	RELAYER_SOLANA_PROGRAM,
	RELAYER_SEPOLIA_PROGRAM,
	CHAIN_WORKER_FILE,
	WORMHOLE_ENVIRONMENT,
	TOKEN_BRIDGE_SOLANA_PID,
	TOKEN_BRIDGE_SEPOLIA_PID,
	TOKEN_BRIDGE_RELAYER_SOLANA_PID,
	TOKEN_BRIDGE_RELAYER_SEPOLIA_PID,
	RELAYER_BASE_SEPOLIA_PROGRAM,
} from "./consts";
import {
	get_relayer_of_current_epoch,
} from "./relayer_hub"
import * as bs58 from  "bs58";
import { parentPort, Worker } from "worker_threads";
import {
	getSolanaConnection,
	getSolanaProgram,
	getSolanaProvider,
	hexStringToUint8Array,
	rightAlignBuffer,
} from "./utils";
import { MessageStorage } from "./message_storage";
import { encodeTokenTransfer } from "./encode_decode";
import { MessageScan } from "./message_scan_worker";

const chainTasks: number[] = [CHAIN_ID_SOLANA, CHAIN_ID_SEPOLIA, CHAIN_ID_BASE_SEPOLIA];
interface WorkerData {
    worker: Worker;
    workerId: number;
}

// One worker per chain.
export const workers: WorkerData[] = [];

let msgStorage:MessageStorage;

function runService(workerId: number) {
    const worker = new Worker(CHAIN_WORKER_FILE, {
        workerData: { workerId },
    });

    worker.on('message', (result) => {
        console.log(`Result from worker ${workerId}: ${result}`);
		if (result.startsWith("done:")) {
			let message = result.split(":");
			let emitterChain = Number(message[1]);
			let emitterAddress = message[2];
			let sequence = message[3];
			let metrics_tx_hash = message[4];
			let metrics_timestamp = message[5];
			let metrics_intent_tx_hash = message[6];
			let metrics_intent_timestamp = message[7];
			msgStorage.discardVaaFromMsgQueue(emitterChain, emitterAddress, sequence);
			msgStorage.clearMessageProcessing(emitterChain, emitterAddress, sequence);
			msgStorage.pushLogMsg(metrics_tx_hash, metrics_timestamp, metrics_intent_tx_hash, metrics_intent_timestamp);
		}
    });

    worker.on('error', (error) => {
        console.error(`Worker ${workerId} error: ${error}`);
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Worker ${workerId} stopped with exit code ${code}`);
        }
    });
    workers.push({ worker, workerId });
}

const defaultStdOpts = {
	spyEndpoint: "localhost:7073",
	workflows: {
		retries: 3,
	},
	fetchSourceTxhash: true,
	logger: defaultLogger,
} satisfies Partial<StandardRelayerAppOpts>;

(async function main() {
	const appName = `BolarityRelayer`;
    chainTasks.forEach(task => runService(task));
    // initialize relayer engine app, pass relevant config options
	const app = new StandardRelayerApp<StandardRelayerContext>(
		WORMHOLE_ENVIRONMENT as Environment,
		{
			name: appName,
			// missedVaaOptions: {
			// 	startingSequenceConfig: {
			// 		[CHAIN_ID_SOLANA]:BigInt(31140),
			// 		[CHAIN_ID_SEPOLIA]:BigInt(318676),
			// 	},
			// 	vaasFetchConcurrency:10,
			// },
		},
	);

	const options = mergeDeep<StandardRelayerAppOpts>({}, [
		defaultStdOpts,
		{
			name: appName,
		},
	]);

	msgStorage = new MessageStorage(app, options);
	await msgStorage.clearAllMessageProcessing();
	// Start message scan worker.
	// new MessageScan(app, options, msgStorage);

	const relayerSolanaKeypair = Keypair.fromSecretKey(bs58.decode(RELAYER_SOLANA_SECRET));
	const relayer = relayerSolanaKeypair.publicKey;
	// init connection
    const connection = getSolanaConnection();
	const provider = getSolanaProvider(connection, relayerSolanaKeypair);
    const currentDirectory = process.cwd();
    const idlPath = currentDirectory + "/idl/relayer_hub.json";
	const relayerHubProgram = getSolanaProgram(idlPath, provider);

	app.multiple(
		{
			[CHAIN_ID_SOLANA]: [RELAYER_SOLANA_PROGRAM, TOKEN_BRIDGE_SOLANA_PID],
			[CHAIN_ID_SEPOLIA]: [RELAYER_SEPOLIA_PROGRAM, RELAYER_SEPOLIA_PROGRAM],
			[CHAIN_ID_BASE_SEPOLIA]: [RELAYER_BASE_SEPOLIA_PROGRAM],
		},
		async (ctx, next) => {
			// Get vaa and check whether it has been executed. If not, continue processing.
			const vaa = ctx.vaa;
			const {payload} = ctx.tokenBridge;
			let hash = ctx.sourceTxHash;
			const now: Date = new Date();
			console.log(
			  `=====${now}==========Got a VAA with sequence: ${vaa.sequence} from with txhash: ${hash}=========================`,
			);
			console.log(
				`===============Got a VAA: ${Buffer.from(ctx.vaaBytes).toString('hex')}=========================`,
			);
			// Filter out messages that do not need to be processed.
			const tkBrgSolanaEmitter = PublicKey.findProgramAddressSync(
				[Buffer.from("emitter")],
				new PublicKey(TOKEN_BRIDGE_SOLANA_PID))[0].toBuffer();

			const tkBrgSepoliaEmitter = rightAlignBuffer(Buffer.from(hexStringToUint8Array(TOKEN_BRIDGE_SEPOLIA_PID)));

			console.log(`===============emitterAddress: ${Buffer.from(vaa.emitterAddress).toString('hex')}=========================`);
			let skipProcess = false;
			// Token bridge message.
			if( ((vaa.emitterChain == CHAIN_ID_SOLANA) && (vaa.emitterAddress == tkBrgSolanaEmitter)) ||
				((vaa.emitterChain == CHAIN_ID_SEPOLIA) && (vaa.emitterAddress == tkBrgSepoliaEmitter))) {
				console.log(`=====emitterChain:${vaa.emitterChain}==========tkBrgSolanaEmitter: ${tkBrgSolanaEmitter.toString('hex')}=========================`);
				console.log(`======emitterChain:${vaa.emitterChain}=========tkBrgSepoliaEmitter: ${tkBrgSepoliaEmitter.toString('hex')}=========================`);
				switch (payload?.payloadType) {
					case TokenBridgePayload.Transfer: {
						// Only redeem solana's cross-chain transfer.
						if (vaa.emitterChain != CHAIN_ID_SOLANA) {
							skipProcess = true;
						}
					}
					break;
					case TokenBridgePayload.TransferWithPayload: {
						if (vaa.emitterChain == CHAIN_ID_SOLANA) {
							if (payload.to != rightAlignBuffer(
								Buffer.from(hexStringToUint8Array(TOKEN_BRIDGE_RELAYER_SEPOLIA_PID)))) {
								skipProcess = true;
							}
						} else if(vaa.emitterChain == CHAIN_ID_SEPOLIA) {
							if (payload.to.toString("hex") != tryNativeToHexString(
								TOKEN_BRIDGE_RELAYER_SOLANA_PID,
								CHAIN_ID_SOLANA
							)) {
								skipProcess = true;
							}
						}
					}
					break;
					default:{
						skipProcess = true;
					}
				}
			}

			if(!skipProcess) {
				let currentRelayer = await get_relayer_of_current_epoch(relayerHubProgram);
				console.log(`================current relayer:${currentRelayer.toBase58()}, your relayer:${relayer.toBase58()}`);

				if (currentRelayer.toBase58() == relayer.toBase58()) {
					console.log("==============Now it's your turn to relay======================");
					// First store message to redis.
					let vaaAndTokenBridge = vaa.bytes.toString('hex');
					let emitterAddress = vaa.emitterAddress.toString('hex');
					await msgStorage.pushVaaToMsgQueue(vaa.emitterChain, emitterAddress, String(vaa.sequence), vaaAndTokenBridge);
				}
			}
			next();
		},
	);

	// start app, blocks until unrecoverable error or process is stopped
	await app.listen();
})();
