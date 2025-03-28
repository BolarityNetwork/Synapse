import { Commitment, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import {
    CONTRACTS,
    postVaaSolana,
    ChainId,
    CHAIN_ID_SEPOLIA,
    SignedVaa,
    TokenTransfer,
    TokenBridgePayload,
    getIsTransferCompletedSolana,
    parseVaa,
    parseTransferPayload, CHAIN_ID_SOLANA,
} from "@certusone/wormhole-sdk";
import {
    deriveAddress,
    NodeWallet,
} from "@certusone/wormhole-sdk/lib/cjs/solana";
import anchor, { Program } from "@coral-xyz/anchor";
import { ParsedVaaWithBytes } from "@wormhole-foundation/relayer-engine/relayer/application";
const borsh = require('borsh');
import { createHash } from 'crypto';
import * as bs58 from  "bs58";
import * as tokenBridgeRelayer from "./sdk/";
import {
    TOKEN_BRIDGE_SOLANA_PID,
    TOKEN_BRIDGE_RELAYER_SOLANA_PID,
    CROSS_SECRET,
    SOL_MINT,
    RELAYER_SEPOLIA_PROGRAM,
    RELAYER_BASE_SEPOLIA_PROGRAM,
    WORMHOLE_NETWORK,
    TOKEN_BRIDGE_SEPOLIA_PID,
    TOKEN_BRIDGE_RELAYER_SEPOLIA_PID, CORE_BRIDGE_PID, TOKEN_BRIDGE_SOLANA_FEE_RECIPIENT,
} from "./consts";
import { createATAForRecipient, postVaaOnSolana, sendAndConfirmIx } from "./utils";
import { ethers } from "ethers";
import { Network } from "@certusone/wormhole-sdk/lib/cjs/utils/consts";

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

export async function processSepoliaToSolana(program:Program, vaa:ParsedVaaWithBytes, vaaBytes:SignedVaa):Promise<[boolean, string]>  {
    const provider = program.provider as anchor.AnchorProvider;
    const wallet = provider.wallet as unknown as NodeWallet;

    const connection = provider.connection;

    let executed = false;
    const NETWORK:Network = WORMHOLE_NETWORK as Network;
    const WORMHOLE_CONTRACTS = CONTRACTS[NETWORK];
    const CORE_BRIDGE_PID = new PublicKey(WORMHOLE_CONTRACTS.solana.core);
    // First, post the VAA to the core bridge
    await postVaaSolana(
        connection,
        async (transaction) => {
            transaction.partialSign(wallet.payer);
            return transaction;
        },
        CORE_BRIDGE_PID,
        wallet.publicKey().toString(),
        Buffer.from(vaaBytes)
    );
    await new Promise(resolve => setTimeout(resolve, 100));
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
    const exp_RawData = borsh.deserialize(RawDataSchema, Buffer.from(vaa.payload).slice(8));
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
                TOKEN_BRIDGE_RELAYER_SOLANA_PID,
                crossKeypair.publicKey,
                TOKEN_BRIDGE_SOLANA_PID,
                CORE_BRIDGE_PID,
                mint,
                sendParams
            );
        console.log(transferIx)
        // Send the transaction.
        try {
            const tx = await sendAndConfirmIx(connection, transferIx, crossKeypair, 250000);
            if (tx === undefined) {
                console.log("Transaction failed:", tx);
                return [executed, ""];
            } else {
                console.log("Transaction successful, txid: ", tx);
            }
        }  catch (error: any) {
            console.error('Transaction failed:', error);
            return [executed, ""];
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
            payer: wallet.publicKey(),
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
        signature = await sendAndConfirmTransaction(connection, tx3, [wallet.payer], {commitment});
        console.log('Transaction successful, txid: ' + signature);
        executed = true;
    }
    catch (error: any) {
        console.error('Transaction failed:', error);
        console.log(error);
    }
    return [executed, signature];
}

async function processSolanaToEvm(
    signer: ethers.Signer,
    contractAbi: { [x: string]: ethers.ContractInterface },
    vaaBytes:SignedVaa,
    address:string,
):Promise<[boolean, string]> {
    let executed = false;
    const contract = new ethers.Contract(
        address,
        contractAbi["abi"],
        signer.provider,
    );
    let hash = "";
    try {
        const contractWithWallet = contract.connect(signer);
        const tx = await contractWithWallet.receiveMessage(vaaBytes);
        hash = tx.hash;
        await tx.wait();
        console.log("Transaction successful:" + hash);
        executed = true;
    } catch (error) {
        console.error("Transaction failed:", error);
    }
    return [executed, hash];
}
export async function processSolanaToSepolia(
    signer: ethers.Signer,
    contractAbi: { [x: string]: ethers.ContractInterface },
    vaaBytes:SignedVaa,
):Promise<[boolean, string]> {
    return await processSolanaToEvm(signer, contractAbi, vaaBytes, RELAYER_SEPOLIA_PROGRAM);
}

export async function processSolanaToBaseSepolia(
    signer: ethers.Signer,
    contractAbi: { [x: string]: ethers.ContractInterface },
    vaaBytes:SignedVaa,
):Promise<[boolean, string]> {
    return await processSolanaToEvm(signer, contractAbi, vaaBytes, RELAYER_BASE_SEPOLIA_PROGRAM);
}

export async function processTokenBridgeTransferFromSolana(
    signer: ethers.Signer,
    vaaBytes:SignedVaa,
):Promise<[boolean, string]> {
    let executed = false;
    const Transfer_ABI = [
        "function completeTransfer(bytes memory encodedVm) external",
    ];
    const contract = new ethers.Contract(
        TOKEN_BRIDGE_SEPOLIA_PID,
        Transfer_ABI,
        signer.provider,
    );
    let hash = "";
    try {
        const contractWithWallet = contract.connect(signer);
        const tx = await contractWithWallet.completeTransfer(vaaBytes);
        hash = tx.hash;
        await tx.wait();
        console.log("Transaction successful:" + hash);
        executed = true;
    } catch (error) {
        console.error("Transaction failed:", error);
    }
    return [executed, hash];
}

export async function processTokenBridgeTransferWithPayloadFromSolana(
    signer: ethers.Signer,
    contractAbi: { [x: string]: ethers.ContractInterface },
    vaaBytes:SignedVaa,
):Promise<[boolean, string]> {
    let executed = false;
    const contract = new ethers.Contract(
        TOKEN_BRIDGE_RELAYER_SEPOLIA_PID,
        contractAbi["abi"],
        signer.provider,
    );
    let hash = "";
    try {
        const contractWithWallet = contract.connect(signer);
        const tx = await contractWithWallet.completeTransferWithRelay(vaaBytes);
        hash = tx.hash;
        await tx.wait();
        console.log("Transaction successful:" + hash);
        executed = true;
    } catch (error) {
        console.error("Transaction failed:", error);
    }
    return [executed, hash];
}

export async function processTokenBridgeTransferWithPayloadFromSepolia(program:Program, vaa:ParsedVaaWithBytes, vaaBytes:SignedVaa):Promise<[boolean, string]> {
    let executed = false;
    let signature ="";
    let signedVaa = Buffer.from(vaaBytes);
    const provider = program.provider as anchor.AnchorProvider;
    const wallet = provider.wallet as unknown as NodeWallet;

    const connection = provider.connection;
    // Check to see if the VAA has been redeemed already.
    const isRedeemed = await getIsTransferCompletedSolana(
        new PublicKey(TOKEN_BRIDGE_SOLANA_PID),
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
            const PROGRAM_ID = new PublicKey(TOKEN_BRIDGE_RELAYER_SOLANA_PID);
            const PROGRAM_ID_HEX = Buffer.from(PROGRAM_ID.toBytes()).toString("hex");
            // Confirm that the destination is the relayer contract.
            if (transferPayload.targetAddress != PROGRAM_ID_HEX) {
                console.log("Destination is not the relayer contract");
            } else {
                // Confirm that the sender is a registered relayer contract.
                const registeredForeignContract =
                    await tokenBridgeRelayer.getForeignContractData(
                        connection,
                        PROGRAM_ID,
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
                            wallet.payer,
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
                        wallet.payer,
                        new PublicKey(TOKEN_BRIDGE_SOLANA_PID),
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
                        PROGRAM_ID,
                        wallet.payer.publicKey,
                        new PublicKey(TOKEN_BRIDGE_SOLANA_FEE_RECIPIENT),
                        new PublicKey(TOKEN_BRIDGE_SOLANA_PID),
                        CORE_BRIDGE_PID,
                        signedVaa,
                        recipient
                    );

                    // Send the transaction.
                    const tx = await sendAndConfirmIx(
                        connection,
                        completeTransferIx,
                        wallet.payer,
                        250000 // compute units
                    );
                    if (tx === undefined) {
                        console.log("Transaction failed.");
                    } else {
                        executed = true
                        signature = tx;
                        console.log("Transaction successful:", tx);
                    }
                }
            }
        }
    }
    return [executed, signature];
}