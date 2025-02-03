import {
	Environment,
	StandardRelayerApp,
	StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import {
    Connection,
    Keypair,
    Commitment,
} from "@solana/web3.js";
import {
	CHAIN_ID_SOLANA ,CHAIN_ID_SEPOLIA
} from "@certusone/wormhole-sdk";
import {
	SOLANA_RPC,
	RELAYER_SOLANA_SECRET,
	RELAYER_SOLANA_PROGRAM,
	RELAYER_SEPOLIA_PROGRAM, RELAYER_SEPOLIA_SECRET, SEPOLIA_RPC,
} from "./consts";
import {
	get_relayer_of_current_epoch,
	init_transaction,
	execute_transaction,
} from "./relayer_hub"
import {Program, Provider} from "@coral-xyz/anchor";
const anchor = require("@coral-xyz/anchor");
import * as bs58 from  "bs58";
import { processSepoliaToSolana, processSolanaToSepolia } from "./controller";
import { ethers } from "ethers";


function hexStringToUint8Array(hexString: string): Uint8Array {
    if (hexString.startsWith("0x")) {
        hexString = hexString.slice(2);
    }

    if (hexString.length % 2 !== 0) {
        throw new Error("Invalid hex string length");
    }

    const byteArray = new Uint8Array(hexString.length / 2);

    for (let i = 0; i < hexString.length; i += 2) {
        const hexPair = hexString.slice(i, i + 2);
        byteArray[i / 2] = parseInt(hexPair, 16);
    }

    return byteArray;
}

(async function main() {
  // initialize relayer engine app, pass relevant config options
	const app = new StandardRelayerApp<StandardRelayerContext>(
		Environment.TESTNET,
		{
			name: `BolarityRelayer`,
		},
	);

	const relayerSolanaKeypair = Keypair.fromSecretKey(bs58.decode(RELAYER_SOLANA_SECRET));
	const relayer = relayerSolanaKeypair.publicKey;
	// init connection
	const commitment: Commitment = "confirmed";
	const connection = new Connection(
		SOLANA_RPC,
        {
            commitment,
            confirmTransactionInitialTimeout: 60 * 10 * 1000,
        }
    );
    const options = anchor.AnchorProvider.defaultOptions();
    const provider = new anchor.AnchorProvider(connection, options);
    anchor.setProvider(provider);
	const currentDirectory = process.cwd();
	const idl = JSON.parse(
		require("fs").readFileSync(currentDirectory + "/idl/relayer_hub.json", "utf8")
	);
	const program = new Program(idl as any, provider);
	const relayerSolanaIdl = JSON.parse(
		require("fs").readFileSync(currentDirectory + "/idl/solana.json", "utf8")
	);
	const relayerSolanaProgram = new Program(relayerSolanaIdl as any, provider);
	// init sepolia connection
	const signer = new ethers.Wallet(RELAYER_SEPOLIA_SECRET, new ethers.providers.JsonRpcProvider(SEPOLIA_RPC));
	const contractAbi = JSON.parse(
		require("fs").readFileSync(currentDirectory + "/idl/UniProxy.json", "utf8")
	);
	app.multiple(
		{
			[CHAIN_ID_SOLANA]: [RELAYER_SOLANA_PROGRAM],
			[CHAIN_ID_SEPOLIA]: [RELAYER_SEPOLIA_PROGRAM],
		},
		async (ctx, next) => {
			// Get vaa and check whether it has been executed. If not, continue processing.
			const vaa = ctx.vaa;
			const hash = ctx.sourceTxHash;
			const now: Date = new Date();
			console.log(
			  `=====${now}==========Got a VAA with sequence: ${vaa.sequence} from with txhash: ${hash}=========================`,
			);
			console.log(
			  `===============Got a VAA: ${Buffer.from(ctx.vaaBytes).toString('hex')}=========================`,
			);
			let currentRelayer = await get_relayer_of_current_epoch(connection, program);
			console.log("================current:" + currentRelayer.toBase58());
			if (currentRelayer.toBase58() == relayer.toBase58()) {
				console.log("==============Now you======================");
				// record relay transaction
				let sequence = await init_transaction(connection, program, Buffer.from(ctx.vaaBytes), relayerSolanaKeypair);
				let success = false;
				if (vaa.emitterChain == CHAIN_ID_SEPOLIA) {
					success = await processSepoliaToSolana(connection, relayerSolanaProgram, relayerSolanaKeypair, vaa, ctx);
				} else if (vaa.emitterChain == CHAIN_ID_SOLANA) {
					success = await processSolanaToSepolia(signer, contractAbi, ctx);
				}
				await execute_transaction(connection, program, sequence, success, relayerSolanaKeypair);
			}
			next();
		},
	);

	// start app, blocks until unrecoverable error or process is stopped
	await app.listen();
})();
