import {
  Environment,
  StandardRelayerApp,
  StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_SOLANA, TokenBridgePayload ,CHAIN_ID_SEPOLIA, getIsTransferCompletedSolana,
parseVaa,parseTransferPayload,ChainId,
} from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
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
    PublicKeyInitData,
    ConfirmOptions,
} from "@solana/web3.js";
import {getOrCreateAssociatedTokenAccount} from "@solana/spl-token";
import {deriveWrappedMintKey} from "@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge";
import * as tokenBridgeRelayer from "./sdk/";
import {
  postVaaSolanaWithRetry,
  NodeWallet,
} from "@certusone/wormhole-sdk/lib/cjs/solana";
// Token Bridge Relayer program ID.
const PROGRAM_ID = new PublicKey('EYcqMLNRMUkHvDMg2Jpng8R5HMeJgt8uX7q372omPVsD');
const PROGRAM_ID_HEX = Buffer.from(PROGRAM_ID.toBytes()).toString("hex");
const TOKEN_BRIDGE_PID = new PublicKey('DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe');
const CORE_BRIDGE_PID = new PublicKey('3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5');
const TOKEN_BRIDGE_RELAYER_PID = new PublicKey('EYcqMLNRMUkHvDMg2Jpng8R5HMeJgt8uX7q372omPVsD');
const FEE_RECIPIENT = new PublicKey('HD4ktk6LUewd5vMePdQF6ZtvKi3mC41AD3ZM3qJW8N8e');
const ASSISTANT = new PublicKey('HD4ktk6LUewd5vMePdQF6ZtvKi3mC41AD3ZM3qJW8N8e');

export class SendIxError extends Error {
  logs: string;

  constructor(originalError: Error & {logs?: string[]}) {
    // The newlines don't actually show up correctly in chai's assertion error, but at least
    // we have all the information and can just replace '\n' with a newline manually to see
    // what's happening without having to change the code.
    const logs = originalError.logs?.join("\n") || "error had no logs";
    super(originalError.message + "\nlogs:\n" + logs);
    this.stack = originalError.stack;
    this.logs = logs;
  }
}
export async function postVaaOnSolana(
  connection: Connection,
  payer: Signer,
  coreBridge: PublicKeyInitData,
  signedMsg: Buffer
) {
  const wallet = NodeWallet.fromSecretKey(payer.secretKey);
  await postVaaSolanaWithRetry(
    connection,
    wallet.signTransaction,
    coreBridge,
    wallet.key(),
    signedMsg
  );
}
export async function createATAForRecipient(
  connection: Connection,
  payer: Signer,
  tokenBridgeProgramId: PublicKeyInitData,
  recipient: PublicKey,
  tokenChain: ChainId,
  tokenAddress: Buffer
) {
  // Get the mint.
  let mint;
  if (tokenChain === CHAIN_ID_SOLANA) {
    mint = new PublicKey(tokenAddress);
  } else {
    mint = deriveWrappedMintKey(tokenBridgeProgramId, tokenChain, tokenAddress);
  }

  // Get or create the ATA.
  try {
    await getOrCreateAssociatedTokenAccount(connection, payer, mint, recipient);
  } catch (error: any) {
    throw new Error("Failed to create ATA: " + (error?.stack || error));
  }
}
export const sendAndConfirmIx = async (
  connection: Connection,
  ix: TransactionInstruction | Promise<TransactionInstruction>,
  signer: Signer,
  computeUnits?: number,
  options?: ConfirmOptions
) => {
  let [signers, units] = (() => {
    if (signer) return [[signer], computeUnits];

    return [Array.isArray(signer) ? signer : [signer], computeUnits];
  })();

  if (options === undefined) {
    options = {};
  }
  options.maxRetries = 10;

  const tx = new Transaction().add(await ix);
  if (units) tx.add(ComputeBudgetProgram.setComputeUnitLimit({units}));
  try {
    return await sendAndConfirmTransaction(connection, tx, signers, options);
  } catch (error: any) {
    console.log(error);
    throw new SendIxError(error);
  }
};
(async function main() {
  // initialize relayer engine app, pass relevant config options
  const app = new StandardRelayerApp<StandardRelayerContext>(
    Environment.TESTNET,
    // other app specific config options can be set here for things
    // like retries, logger, or redis connection settings.
    {
      name: `ExampleRelayer`,
    },
  );
   const commitment: Commitment = "confirmed";
    const connection = new Connection(
        "",
        {
            commitment,
            confirmTransactionInitialTimeout: 60 * 10 * 1000,
        }
    );
    const payer = Keypair.fromSecretKey(Uint8Array.from([
    ]));
							    
  app.multiple(
  {
    [CHAIN_ID_SOLANA]: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
    [CHAIN_ID_SEPOLIA]: ["0xDB5492265f6038831E89f495670FF909aDe94bd9"],
  },
	async (ctx, next) => {
	const vaa = ctx.vaa;
      console.log(
        `===============Got a VAA with sequence: ${vaa.sequence} from with txhash: ${vaa.emitterChain}=========================`,
      );
      console.log(
        `===============Got a VAA: ${vaa.payload}=========================`,
      );
		 if (vaa.emitterChain == 10002) {
		 				      const { payload } = ctx.tokenBridge;
			
			      // only care about transfers
			      // TODO: do something more interesting than logging like:
			      // - redemption of VAA on target chain
			      // - tracking transfer amounts over time
			      switch (payload?.payloadType) {
			        case TokenBridgePayload.Transfer:
			          ctx.logger.info(
			            `Transfer processing for: \n` +
			              `\tToken: ${payload.tokenChain}:${payload.tokenAddress.toString(
			                "hex",
			              )}\n` +
			              `\tAmount: ${payload.amount}\n` +
			              `\tReceiver: ${payload.toChain}:${payload.to.toString("hex")}\n`,
			          );
			          break;
			        case TokenBridgePayload.TransferWithPayload:
			          {ctx.logger.info(
			            `Transfer processing for: \n` +
			              `\tToken: ${payload.tokenChain}:${payload.tokenAddress.toString(
			                "hex",
			              )}\n` +
			              `\tAmount: ${payload.amount}\n` +
			              `\tSender ${payload.fromAddress?.toString("hex")}\n` +
			              `\tReceiver: ${payload.toChain}:${payload.to.toString("hex")}\n` +
			              `\tPayload: ${payload.tokenTransferPayload.toString("hex")}\n`,
			          );
			          }
			      }
			  if (payload.to.toString("hex")=="c94173cc83e460d64a8b533b87dbfd29485f796e5f11e0150bc429f6e2690b80"){
			  	let signedVaa = Buffer.from(ctx.vaaBytes);
				  // Check to see if the VAA has been redeemed already.
				  const isRedeemed = await getIsTransferCompletedSolana(
				    new PublicKey(TOKEN_BRIDGE_PID),
				    signedVaa,
				    connection
				  );
				  if (isRedeemed) {
				    console.log("VAA has already been redeemed");
				  } else {
				  	  // Parse the VAA.
					  const parsedVaa = parseVaa(signedVaa);
					
					  // Make sure it's a payload 3.
					  const payloadType = parsedVaa.payload.readUint8(0);
					  if (payloadType != 3) {
					    console.log("Not a payload 3");
					  } else {
					  	  // Parse the payload.
						  const transferPayload = parseTransferPayload(parsedVaa.payload);
						  console.log(transferPayload);
						  // Confirm that the destination is the relayer contract.
						  if (transferPayload.targetAddress != PROGRAM_ID_HEX) {
						    console.log("Destination is not the relayer contract");
						  } else {
						  	  // Confirm that the sender is a registered relayer contract.
							  const registeredForeignContract =
							    await tokenBridgeRelayer.getForeignContractData(
							      connection,
							      TOKEN_BRIDGE_RELAYER_PID,
							      parsedVaa.emitterChain as ChainId
							    );
							  if (
							    registeredForeignContract.address.toString("hex") !==
							    transferPayload.fromAddress
							  ) {
							    console.log("Sender is not a registered relayer contract");
							  } else {
							  	  // Post the VAA on chain.
								  try {
								    await postVaaOnSolana(
								      connection,
								      payer,
								      new PublicKey(CORE_BRIDGE_PID),
								      signedVaa
								    );
								  } catch (e) {
								    console.log(e);
								  }
								    // Parse the recipient address from the additional payload.
								  const recipientInPayload = parsedVaa.payload.subarray(198, 230);
								  const recipient = new PublicKey(recipientInPayload);
								
								  // Create the associated token account for the recipient if it doesn't exist.
								  await createATAForRecipient(
								    connection,
								    payer,
								    new PublicKey(TOKEN_BRIDGE_PID),
								    recipient,
								    transferPayload.originChain as ChainId,
								    Buffer.from(transferPayload.originAddress, "hex")
								  );
								
								  // See if the token being transferred is native to Solana.
								  const isNative = transferPayload.originChain == CHAIN_ID_SOLANA;
								  // Create the redemption instruction. There are two different instructions
								  // depending on whether the token is native or not.
								  const completeTransferIx = await (isNative
								    ? tokenBridgeRelayer.createCompleteNativeTransferWithRelayInstruction
								    : tokenBridgeRelayer.createCompleteWrappedTransferWithRelayInstruction)(
								    connection,
								    TOKEN_BRIDGE_RELAYER_PID,
								    payer.publicKey,
								    new PublicKey(FEE_RECIPIENT),
								    TOKEN_BRIDGE_PID,
								    CORE_BRIDGE_PID,
								    signedVaa,
								    recipient
								  );
								
								  // Send the transaction.
								  const tx = await sendAndConfirmIx(
								    connection,
								    completeTransferIx,
								    payer,
								    250000 // compute units
								  );
								  if (tx === undefined) {
								    console.log("Transaction failed.");
								  } else {
								    console.log("Transaction successful:", tx);
								  }
							  }
						  }
					  }
				  }
			  }
		 }else if (vaa.emitterChain == 1) {
			      const { payload } = ctx.tokenBridge;
			
			      // only care about transfers
			      // TODO: do something more interesting than logging like:
			      // - redemption of VAA on target chain
			      // - tracking transfer amounts over time
			      switch (payload?.payloadType) {
			        case TokenBridgePayload.Transfer:
			          {ctx.logger.info(
			            `Transfer processing for: \n` +
			              `\tToken: ${payload.tokenChain}:${payload.tokenAddress.toString(
			                "hex",
			              )}\n` +
			              `\tAmount: ${payload.amount}\n` +
			              `\tReceiver: ${payload.toChain}:${payload.to.toString("hex")}\n`,
			          );
			          //if (payload.to.toString("hex")=="000000000000000000000000049b426457b5a75e0e25f0b692df581a06035647"){
			          	ctx.logger.info(
			              `\tencodedTransferMessage: ${ctx.vaaBytes.toString("hex")}\n`,
			          )
			          	  console.log("===============================ether=====================================================");
			          	      const privateKeyList = [
							    ];
							    var index = Number(vaa.sequence)%5;
							  const privateKey = privateKeyList[index];

							  const provider = new ethers.providers.JsonRpcProvider("https://1rpc.io/sepolia");
							  console.log("===============================1=====================================================");

							  const signer = new ethers.Wallet(privateKey, provider);
							  console.log("===============================2=====================================================");

							  const USDT_ABI = [
    												"function completeTransfer(bytes memory encodedVm) external",
									];
							  const contract = new ethers.Contract("0xDB5492265f6038831E89f495670FF909aDe94bd9", USDT_ABI, provider);
							  try {
							    console.log("===============================3=====================================================");

							    const contractWithWallet = contract.connect(signer)
							
							   const tx = await contractWithWallet.completeTransfer(ctx.vaaBytes);
							    console.log("===============================4=====================================================");

							    await tx.wait();
							    console.log("===============================5=====================================================");
							    console.log('Transaction successful');
							  } catch (error) {
							    console.error('Transaction failed:', error);
							    console.log("===============================6=====================================================");
							  }
			          //}
			          }
			          break;
			        case TokenBridgePayload.TransferWithPayload:
			          {ctx.logger.info(
			            `Transfer processing for: \n` +
			              `\tToken: ${payload.tokenChain}:${payload.tokenAddress.toString(
			                "hex",
			              )}\n` +
			              `\tAmount: ${payload.amount}\n` +
			              `\tSender ${payload.fromAddress?.toString("hex")}\n` +
			              `\tReceiver: ${payload.toChain}:${payload.to.toString("hex")}\n` +
			              `\tPayload: ${payload.tokenTransferPayload.toString("hex")}\n`,
			          );
			          if (payload.to.toString("hex")=="0000000000000000000000007fb0d63258caf51d8a35130d3f7a7fd1ee893969"){
			          	ctx.logger.info(
			              `\tencodedTransferMessage: ${ctx.vaaBytes.toString("hex")}\n`,
			          )
			          	  console.log("===============================ether=====================================================");
			          	      const privateKeyList = [
							    ];
							    var index = Number(vaa.sequence)%5;
							  const privateKey = privateKeyList[index];
							//for (let i = 0; i < ctx.vaaBytes.length; i++) {
							//    console.log(ctx.vaaBytes[i], ',');
							//}

							  const provider = new ethers.providers.JsonRpcProvider("https://1rpc.io/sepolia");
							  console.log("===============================1=====================================================");

							  const signer = new ethers.Wallet(privateKey, provider);
							const contractAbi = JSON.parse(
							      require("fs").readFileSync("/home/ubuntu/relayer-engine/examples/hackthon/src/TokenBridgeRelayer.json", "utf8")
							  );
							  console.log("===============================2=====================================================");

							  const contract = new ethers.Contract("0x7Fb0D63258caF51D8A35130d3f7A7fd1EE893969", contractAbi["abi"], provider);
							  try {
							    const coder = ethers.utils.defaultAbiCoder;
							    const sourceAddress = coder.encode(["bytes"],[Buffer.from(ctx.vaaBytes)]);
							    console.log("===============================3=====================================================");

							    const contractWithWallet = contract.connect(signer)
							    //const tx = await contractWithWallet.receiveMessage(ctx.vaaBytes,{gasLimit: 3e7});
							  const feeData = await provider.getFeeData()
							  const gasPrice = feeData.gasPrice
							  console.log(gasPrice);
							
							   const tx = await contractWithWallet.completeTransferWithRelay(ctx.vaaBytes);
							    console.log("===============================4=====================================================");

							    await tx.wait();
							    console.log("===============================5=====================================================");
							    console.log('Transaction successful');
							  } catch (error) {
							    console.error('Transaction failed:', error);
							    console.log("===============================6=====================================================");
							  }
			          }
			        
			          }
			          break;
			      }
		 }
		next();
	},
);

  // start app, blocks until unrecoverable error or process is stopped
  await app.listen();
})();
