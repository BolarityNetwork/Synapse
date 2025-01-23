import {
	Environment,
	StandardRelayerApp,
	StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import {
    LAMPORTS_PER_SOL,
    Connection,
    TransactionInstruction,
    sendAndConfirmTransaction,
    Transaction,
    Signer,
    PublicKey,
    ComputeBudgetProgram,
    Keypair,
    Commitment,
} from "@solana/web3.js";
import {
	CHAIN_ID_SOLANA ,CHAIN_ID_SEPOLIA
} from "@certusone/wormhole-sdk";
import {
	RELAYER_HUB_PID,
	RPC,
	RELAYER_SECRET,
	RELAYER_PROGRAM,
} from "./consts"
import {
	get_relayer_of_current_epoch,
	init_transaction,
	execute_transaction,
} from "./relayer_hub"
import {Program, Provider} from "@coral-xyz/anchor";
const anchor = require("@coral-xyz/anchor");
import * as bs58 from  "bs58";


(async function main() {
  // initialize relayer engine app, pass relevant config options
	const app = new StandardRelayerApp<StandardRelayerContext>(
		Environment.TESTNET,
		{
			name: `BolarityRelayer`,
		},
	);

	const relayerKeypair = Keypair.fromSecretKey(bs58.decode(RELAYER_SECRET));
	const relayer = relayerKeypair.publicKey;
	// init connection
	const commitment: Commitment = "confirmed";
	const connection = new Connection(
        RPC,
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
	let currentRelayer = await get_relayer_of_current_epoch(connection, program);

	if (currentRelayer.toBase58() == relayer.toBase58()) {
		console.log("==============Now you======================");
	}

	app.multiple(
		{
			[CHAIN_ID_SOLANA]: [RELAYER_PROGRAM],
			[CHAIN_ID_SEPOLIA]: [],
		},
		async (ctx, next) => {
			// Get vaa and check whether it has been executed. If not, continue processing.
			const vaa = ctx.vaa;
			const hash = ctx.sourceTxHash;
			vaa.emitterChain
			console.log(
			  `===============Got a VAA with sequence: ${vaa.sequence} from with txhash: ${vaa.emitterChain}=========================`,
			);
			console.log(
			  `===============Got a VAA: ${Buffer.from(ctx.vaaBytes).toString('hex')}=========================`,
			);
			// if (vaa.emitterChain == 10002) {
			// }
			// record relay transaction
			let sequence = await init_transaction(connection, program, Buffer.from(ctx.vaaBytes), relayerKeypair);
			// TODO: do relay
			let success = true;
			await execute_transaction(connection, program, sequence, success, relayerKeypair);
			next();
		},
	);

	// start app, blocks until unrecoverable error or process is stopped
	await app.listen();
})();
