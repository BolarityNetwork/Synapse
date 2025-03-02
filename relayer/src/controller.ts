import { Commitment, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import {
    CONTRACTS,
    postVaaSolana,
    ChainId,
    CHAIN_ID_SEPOLIA, SignedVaa,
} from "@certusone/wormhole-sdk";
import {
    deriveAddress,
    getPostMessageCpiAccounts,
} from "@certusone/wormhole-sdk/lib/cjs/solana";
import { Program } from "@coral-xyz/anchor";
import { RelayerHub } from "../types/relayer_hub";
import { ParsedVaaWithBytes } from "@wormhole-foundation/relayer-engine/relayer/application";
import { StandardRelayerContext } from "@wormhole-foundation/relayer-engine";
const borsh = require('borsh');
import { createHash } from 'crypto';
import * as bs58 from  "bs58";
import * as tokenBridgeRelayer from "./sdk/";
import {
    TOKEN_BRIDGE_PID,
    TOKEN_BRIDGE_RELAYER_PID,
    CROSS_SECRET, SOL_MINT, RELAYER_SEPOLIA_SECRET, RELAYER_SEPOLIA_PROGRAM,
} from "./consts";
import { sendAndConfirmIx } from "./utils";
import { ethers } from "ethers";

function sha256(input: string): Buffer {
    const hash = createHash('sha256');
    hash.update(input);
    return hash.digest();
}

export interface SendTokensParams {
    amount: number;
    toNativeTokenAmount: number;
    recipientAddress: Buffer;
    recipientChain: ChainId;
    batchId: number;
    wrapNative: boolean;
}

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

export async function processSepoliaToSolana(connection:Connection, program:Program, adminKeypair:Keypair, vaa:ParsedVaaWithBytes, vaaBytes:SignedVaa):Promise<[boolean, string]>  {
    let executed = false;
    const NETWORK = "TESTNET";
    const WORMHOLE_CONTRACTS = CONTRACTS[NETWORK];
    const CORE_BRIDGE_PID = new PublicKey(WORMHOLE_CONTRACTS.solana.core);
    // First, post the VAA to the core bridge
    await postVaaSolana(
        connection,
        async (transaction) => {
            transaction.partialSign(adminKeypair);
            return transaction;
        },
        CORE_BRIDGE_PID,
        adminKeypair.publicKey.toString(),
        Buffer.from(vaaBytes)
    );
    function renameFolder() {
        console.log("delay~~");
    }
    setTimeout(renameFolder, 20000);
    const realConfig = deriveAddress([Buffer.from("config")], program.programId);
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
        program.programId
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
        program.programId
    );
    const exp_RawData = borsh.deserialize(RawDataSchema, Buffer.from(vaa.payload));
    console.log(exp_RawData)
    if (Buffer.from(exp_RawData.paras).slice(0, 8).equals(Buffer.from("crosstsf"))){
        let balanceBuf = Buffer.from(exp_RawData.paras).slice(8, 16)
        const valueLE = balanceBuf.readBigUInt64LE(0);
        console.log(`Little-endian: ${valueLE}`);
        let toAddress = Buffer.from(exp_RawData.paras).slice(16)
        const buf32 = Buffer.alloc(32);
        toAddress.copy(buf32, 12);
        console.log(Buffer.from(buf32).toString('hex'));
        const paras = sha256("transfer").slice(0, 8);
        const buf = Buffer.alloc(8);
        buf.writeBigUint64LE(BigInt(valueLE),0);
        const encodedParams = Buffer.concat([paras, buf]);
        exp_RawData.paras = [...encodedParams];
        console.log(exp_RawData);
        const sendParams: SendTokensParams = {
            amount: Number(valueLE),
            toNativeTokenAmount: 0,
            recipientAddress: buf32,
            recipientChain: CHAIN_ID_SEPOLIA, // sepolie
            batchId: 0,
            wrapNative: true,
        };
        const mint = new PublicKey(SOL_MINT);
        // Create registration transaction.
        const crossKeypair = Keypair.fromSecretKey(
            bs58.decode(CROSS_SECRET));
        const transferIx =
            await tokenBridgeRelayer.createTransferNativeTokensWithRelayInstruction(
                connection,
                TOKEN_BRIDGE_RELAYER_PID,
                crossKeypair.publicKey,
                TOKEN_BRIDGE_PID,
                CORE_BRIDGE_PID,
                mint,
                sendParams
            );
        console.log(transferIx)
        // Send the transaction.
        const tx = await sendAndConfirmIx(connection, transferIx, crossKeypair, 250000);
        if (tx === undefined) {
            console.log("Transaction failed:", tx);
            return [executed, ""];
        } else {
            console.log("Transaction successful:", tx);
        }
    }
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
        new PublicKey(program.programId));
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
    let signature ="";
    try {
        let commitment: Commitment = 'confirmed';
        signature = await sendAndConfirmTransaction(connection, tx3, [adminKeypair], {commitment});
        console.log('Transaction successful, txid:' + signature);
        executed = true;
    }
    catch (error: any) {
        console.error('Transaction failed:', error);
        console.log(error);
    }
    return [executed, signature];
}


export async function processSolanaToSepolia(
    signer: ethers.Signer,
    contractAbi: { [x: string]: ethers.ContractInterface },
    vaaBytes:SignedVaa,
):Promise<[boolean, string]> {
    let executed = false;
    const contract = new ethers.Contract(
        RELAYER_SEPOLIA_PROGRAM,
        contractAbi["abi"],
        signer.provider,
    );
    let hash = "";
    try {
        const contractWithWallet = contract.connect(signer);
        const tx = await contractWithWallet.receiveMessage(vaaBytes);
        hash = tx.hash;
        await tx.wait();
        console.log("Transaction successful");
        executed = true;
    } catch (error) {
        console.error("Transaction failed:", error);
    }
    return [executed, hash];
}