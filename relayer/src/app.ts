import {
	Environment,
	StandardRelayerApp,
	StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import {
	Keypair, PublicKey,
} from "@solana/web3.js";
import {
	CHAIN_ID_SOLANA, CHAIN_ID_SEPOLIA, tryNativeToHexString, TokenBridgePayload,
} from "@certusone/wormhole-sdk";
import {
	RELAYER_SOLANA_SECRET,
	RELAYER_SOLANA_PROGRAM,
	RELAYER_SEPOLIA_PROGRAM,
	CHAIN_WORKER_FILE,
	WORMHOLE_ENVIRONMENT,
	TOKEN_BRIDGE_SOLANA_PID,
	TOKEN_BRIDGE_SEPOLIA_PID,
	TOKEN_BRIDGE_RELAYER_SOLANA_PID, TOKEN_BRIDGE_RELAYER_SEPOLIA_PID,
} from "./consts";
import {
	get_relayer_of_current_epoch,
} from "./relayer_hub"
import * as bs58 from  "bs58";
import { Worker } from 'worker_threads';
import {
	getSolanaConnection,
	getSolanaProgram,
	getSolanaProvider,
	hexStringToUint8Array,
	rightAlignBuffer,
} from "./utils";

const chainTasks: number[] = [CHAIN_ID_SOLANA, CHAIN_ID_SEPOLIA];
interface WorkerData {
    worker: Worker;
    workerId: number;
}

// One worker per chain.
const workers: WorkerData[] = [];

function runService(workerId: number) {
    const worker = new Worker(CHAIN_WORKER_FILE, {
        workerData: { workerId },
    });

    worker.on('message', (result) => {
        console.log(`Result from worker ${workerId}: ${result}`);
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

(async function main() {
    chainTasks.forEach(task => runService(task));
    // initialize relayer engine app, pass relevant config options
	const app = new StandardRelayerApp<StandardRelayerContext>(
		WORMHOLE_ENVIRONMENT as Environment,
		{
			name: `BolarityRelayer`,
		},
	);

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
			[CHAIN_ID_SOLANA]: [RELAYER_SOLANA_PROGRAM],
			[CHAIN_ID_SEPOLIA]: [RELAYER_SEPOLIA_PROGRAM],
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
					const workerData = workers.find(w => w.workerId === vaa.emitterChain);
					if(workerData != undefined) {
						workerData.worker.postMessage({vaa, tokenBridge:payload});
					}
				}
			}
			next();
		},
	);

	// start app, blocks until unrecoverable error or process is stopped
	await app.listen();
})();
