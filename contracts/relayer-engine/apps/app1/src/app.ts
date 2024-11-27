import {
  Environment,
  StandardRelayerApp,
  StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_SOLANA, CONTRACTS, CHAIN_ID_BSC,CHAIN_ID_ETH,CHAIN_ID_SEPOLIA,
postVaaSolana,
} from "@certusone/wormhole-sdk";
import * as bs58 from  "bs58";

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
const anchor = require("@coral-xyz/anchor");
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  deriveAddress,
  getPostMessageCpiAccounts,
} from "@certusone/wormhole-sdk/lib/cjs/solana";
import fs from 'fs';
import { ethers } from "ethers";
const borsh = require('borsh');

export const WORMHOLE_CONTRACTS = CONTRACTS["TESTNET"];
export const CORE_BRIDGE_PID = new PublicKey(WORMHOLE_CONTRACTS.solana.core);
const RawDataSchema = {
    struct:{
        chain_id:'u16',
        caller:{array: {type:'u8', len:32}},
        programId:{array: {type:'u8', len:32}},
        acc_count:'u8',
        accounts:{
            array: {
                type: {
                    struct:{
                        key:{array: {type:'u8', len:32}},
                        isWritable:'bool',
                        isSigner:'bool'
                    }
                },
            }
        },
        paras: {array: {type:'u8'}},
        acc_meta: {array: {type:'u8'}},
    }
};
(async function main() {
  // initialize relayer engine app, pass relevant config options
  const app = new StandardRelayerApp<StandardRelayerContext>(
    Environment.TESTNET,
    // other app specific config options can be set here for things
    // like retries, logger, or redis connection settings.
    {
      name: "ExampleRelayer",
    },
  );
  console.log(CORE_BRIDGE_PID.toBase58())

    const privateKey = [
    ];
    const adminWallet = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(privateKey));
    const commitment: Commitment = "confirmed";
    const connection = new Connection(
        "",
        {
            commitment,
            confirmTransactionInitialTimeout: 60 * 10 * 1000,
        }
    );
  const adminKeypair = Keypair.fromSecretKey(
      bs58.decode(''));
    const options = anchor.AnchorProvider.defaultOptions();
    const wallet = new NodeWallet(adminWallet);
    const provider = new anchor.AnchorProvider(connection, wallet, options);
    anchor.setProvider(provider);
  const idl = JSON.parse(
      require("fs").readFileSync("./solana.json", "utf8")
  );
  const programID=new PublicKey("CLErExd7gNADvu5rDFmkFD1uAt7zksJ3TDfXsJqJ4QTs")
  const program = new anchor.Program(idl, programID);
  const HELLO_WORLD_PID = program.programId;
   console.log(HELLO_WORLD_PID.toBase58())
      console.log(     anchor.getProvider().publicKey.toBase58())
  app.multiple(
  {
    [CHAIN_ID_SOLANA]: ["CLErExd7gNADvu5rDFmkFD1uAt7zksJ3TDfXsJqJ4QTs"],
    [CHAIN_ID_SEPOLIA]: ["0x438aCC4fB994D97A052d225f0Ca3BF720a3552A9"],
  },
	async (ctx, next) => {
      const vaa = ctx.vaa;
      const hash = ctx.sourceTxHash;
      console.log(
        `===============Got a VAA with sequence: ${vaa.sequence} from with txhash: ${vaa.emitterChain}=========================`,
      );
      console.log(
        `===============Got a VAA: ${Buffer.from(ctx.vaaBytes).toString('hex')}=========================`,
      );
      if (vaa.emitterChain == 10002) {
      	console.log("====================================")
      	console.log(ctx.vaaBytes)
      	console.log("====================================")
    // First, post the VAA to the core bridge
    await postVaaSolana(
        connection,
          async (transaction) => {
            transaction.partialSign(adminKeypair);
            return transaction;
          },
        CORE_BRIDGE_PID,
        adminKeypair.publicKey.toString(),
        Buffer.from(ctx.vaaBytes)
    );

    const realConfig = deriveAddress([Buffer.from("config")], HELLO_WORLD_PID);
    const posted = deriveAddress([Buffer.from("PostedVAA"), vaa.hash], CORE_BRIDGE_PID);
    const fe = deriveAddress(
        [
            Buffer.from("foreign_emitter"),
            (() => {
                const buf = Buffer.alloc(2);
                buf.writeUInt16LE(vaa.emitterChain);
                return buf;
            })(),
        ],
        HELLO_WORLD_PID
    );
    const received = deriveAddress(
        [
            Buffer.from("received"),
            (() => {
                const buf = Buffer.alloc(10);
                buf.writeUInt16LE(vaa.emitterChain, 0);
                buf.writeBigInt64LE(vaa.sequence, 2);
                return buf;
            })(),
        ],
        HELLO_WORLD_PID
    );
      //const msgbuf= [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,185,167,64,222,67,51,185,246,172,16,254,198,6,168,58,248,63,105,134,164,73,62,137,165,0,218,29,142,18,155,134,128,1,1,0,0,0,75,192,167,90,110,177,139,223,43,184,94,212,90,29,163,113,88,155,255,227,252,64,212,71,168,230,197,125,137,43,251,179,1,0,10,0,0,0,198,51,53,241,116,29,126,194,2,2,6,0,0,0,1,0,0,0,1,0];

  //const [myStorage, _bump] = anchor.web3.PublicKey.findProgramAddressSync([], new PublicKey('DViLwexyLUuKRRXWCQgFYqzoVLWktEbvUVhzKNZ7qTSF'));

        //const accountMeta1 = {pubkey: myStorage, isWritable: true, isSigner: false};
        //const accountMeta2 = {pubkey: Keypair.generate().publicKey, isWritable: true, isSigner: false};
        //const accountMeta3 = {pubkey: Keypair.generate().publicKey, isWritable: true, isSigner: false};
    const exp_RawData = borsh.deserialize(RawDataSchema, Buffer.from(vaa.payload));
    console.log(exp_RawData)
    const contract_pbkey = new PublicKey(exp_RawData.programId)
    console.log(contract_pbkey.toBase58())
    const meta_accounts = exp_RawData.accounts
    const remainingAccounts = []
    for (const meta_account of meta_accounts) {
        remainingAccounts.push({pubkey: new PublicKey(meta_account.key), isWritable: meta_account.isWritable, isSigner: false})
    }
    console.log(remainingAccounts)
    const caller = exp_RawData.caller
    const chain_id = exp_RawData.chain_id
        const [tempKey, bump] = PublicKey.findProgramAddressSync([
        Buffer.from("pda"),
            (() => {
                const buf = Buffer.alloc(2);
                buf.writeUInt16LE(chain_id);
                return buf;
            })(),
            new PublicKey(caller).toBuffer(),
        ],
        new PublicKey(HELLO_WORLD_PID));
    console.log(tempKey.toBase58(), bump)
    const ix = program.methods
        .receiveMessage([...vaa.hash], bump, chain_id, new PublicKey(caller).toBuffer())
        .accounts({
            payer: adminKeypair.publicKey,
            config: realConfig,
            wormholeProgram: CORE_BRIDGE_PID,
            posted: posted,
            foreignEmitter: fe,
            received: received,
            programAccount: contract_pbkey,
        }).remainingAccounts(remainingAccounts)
        .instruction();

    const tx3 = new Transaction().add(await ix);
    try {
        let commitment: Commitment = 'confirmed';
        await sendAndConfirmTransaction(provider.connection, tx3, [adminKeypair], {commitment});
        console.log('Transaction successful');
    }
    catch (error: any) {
    	console.error('Transaction failed:', error);
        console.log(error);
    }
      } else if (vaa.emitterChain == 1) {
console.log("===============================ether=====================================================");
    const privateKeyList = [
    ];
    var index = Number(vaa.sequence)%5;
  const privateKey = privateKeyList[index];

  const provider = new ethers.providers.JsonRpcProvider("https://eth-sepolia.api.onfinality.io/public");
  console.log("===============================1=====================================================");

  const signer = new ethers.Wallet(privateKey, provider);
const contractAbi = JSON.parse(
      require("fs").readFileSync("./UniProxy.json", "utf8")
  );
  console.log("===============================2=====================================================");

  const contract = new ethers.Contract("0x438aCC4fB994D97A052d225f0Ca3BF720a3552A9", contractAbi["abi"], provider);
  try {
    const coder = ethers.utils.defaultAbiCoder;
    const sourceAddress = coder.encode(["bytes"],[Buffer.from(ctx.vaaBytes)]);
    console.log("===============================3=====================================================");

    const contractWithWallet = contract.connect(signer)
    const tx = await contractWithWallet.receiveMessage(ctx.vaaBytes);
    console.log("===============================4=====================================================");

    await tx.wait();
    console.log("===============================5=====================================================");
    console.log('Transaction successful');
  } catch (error) {
    console.error('Transaction failed:', error);
    console.log("===============================6=====================================================");
  }
      	
      }
    },
);

  // add and configure any other middleware ..

  // start app, blocks until unrecoverable error or process is stopped
  await app.listen();
})();