"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSolanaToSepolia = exports.processSepoliaToSolana = void 0;
const web3_js_1 = require("@solana/web3.js");
const wormhole_sdk_1 = require("@certusone/wormhole-sdk");
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const borsh = require('borsh');
const crypto_1 = require("crypto");
const bs58 = require("bs58");
const tokenBridgeRelayer = require("./sdk/");
const consts_1 = require("./consts");
const utils_1 = require("./utils");
const ethers_1 = require("ethers");
function sha256(input) {
    const hash = (0, crypto_1.createHash)('sha256');
    hash.update(input);
    return hash.digest();
}
const RawDataSchema = {
    struct: {
        chain_id: 'u16',
        caller: { array: { type: 'u8', len: 32 } },
        programId: { array: { type: 'u8', len: 32 } },
        acc_count: 'u8',
        accounts: {
            array: {
                type: {
                    struct: {
                        key: { array: { type: 'u8', len: 32 } },
                        isWritable: 'bool',
                        isSigner: 'bool'
                    }
                },
            }
        },
        paras: { array: { type: 'u8' } },
        acc_meta: { array: { type: 'u8' } },
    }
};
async function processSepoliaToSolana(connection, program, adminKeypair, vaa, ctx) {
    let executed = false;
    const NETWORK = "TESTNET";
    const WORMHOLE_CONTRACTS = wormhole_sdk_1.CONTRACTS[NETWORK];
    const CORE_BRIDGE_PID = new web3_js_1.PublicKey(WORMHOLE_CONTRACTS.solana.core);
    // First, post the VAA to the core bridge
    await (0, wormhole_sdk_1.postVaaSolana)(connection, async (transaction) => {
        transaction.partialSign(adminKeypair);
        return transaction;
    }, CORE_BRIDGE_PID, adminKeypair.publicKey.toString(), Buffer.from(ctx.vaaBytes));
    function renameFolder() {
        console.log("delay~~");
    }
    setTimeout(renameFolder, 20000);
    const realConfig = (0, solana_1.deriveAddress)([Buffer.from("config")], program.programId);
    const posted = (0, solana_1.deriveAddress)([Buffer.from("PostedVAA"), vaa.hash], CORE_BRIDGE_PID);
    const fe = (0, solana_1.deriveAddress)([
        Buffer.from("foreign_emitter"),
        (() => {
            const buf = Buffer.alloc(2);
            buf.writeUInt16LE(vaa.emitterChain);
            return buf;
        })(),
    ], program.programId);
    const received = (0, solana_1.deriveAddress)([
        Buffer.from("received"),
        (() => {
            const buf = Buffer.alloc(10);
            buf.writeUInt16LE(vaa.emitterChain, 0);
            buf.writeBigInt64LE(vaa.sequence, 2);
            return buf;
        })(),
    ], program.programId);
    const exp_RawData = borsh.deserialize(RawDataSchema, Buffer.from(vaa.payload));
    console.log(exp_RawData);
    if (Buffer.from(exp_RawData.paras).slice(0, 8).equals(Buffer.from("crosstsf"))) {
        let balanceBuf = Buffer.from(exp_RawData.paras).slice(8, 16);
        const valueLE = balanceBuf.readBigUInt64LE(0);
        console.log(`Little-endian: ${valueLE}`);
        let toAddress = Buffer.from(exp_RawData.paras).slice(16);
        const buf32 = Buffer.alloc(32);
        toAddress.copy(buf32, 12);
        console.log(Buffer.from(buf32).toString('hex'));
        const paras = sha256("transfer").slice(0, 8);
        const buf = Buffer.alloc(8);
        buf.writeBigUint64LE(BigInt(valueLE), 0);
        const encodedParams = Buffer.concat([paras, buf]);
        exp_RawData.paras = [...encodedParams];
        console.log(exp_RawData);
        const sendParams = {
            amount: Number(valueLE),
            toNativeTokenAmount: 0,
            recipientAddress: buf32,
            recipientChain: wormhole_sdk_1.CHAIN_ID_SEPOLIA,
            batchId: 0,
            wrapNative: true,
        };
        const mint = new web3_js_1.PublicKey(consts_1.SOL_MINT);
        // Create registration transaction.
        const crossKeypair = web3_js_1.Keypair.fromSecretKey(bs58.decode(consts_1.CROSS_SECRET));
        const transferIx = await tokenBridgeRelayer.createTransferNativeTokensWithRelayInstruction(connection, consts_1.TOKEN_BRIDGE_RELAYER_PID, crossKeypair.publicKey, consts_1.TOKEN_BRIDGE_PID, CORE_BRIDGE_PID, mint, sendParams);
        console.log(transferIx);
        // Send the transaction.
        const tx = await (0, utils_1.sendAndConfirmIx)(connection, transferIx, crossKeypair, 250000);
        if (tx === undefined) {
            console.log("Transaction failed:", tx);
            return [executed, ""];
        }
        else {
            console.log("Transaction successful:", tx);
        }
    }
    const contract_pbkey = new web3_js_1.PublicKey(exp_RawData.programId);
    console.log(contract_pbkey.toBase58());
    const meta_accounts = exp_RawData.accounts;
    const remainingAccounts = [];
    for (const meta_account of meta_accounts) {
        remainingAccounts.push({ pubkey: new web3_js_1.PublicKey(meta_account.key), isWritable: meta_account.isWritable, isSigner: false });
    }
    console.log(remainingAccounts);
    const caller = exp_RawData.caller;
    const chain_id = exp_RawData.chain_id;
    const [tempKey, bump] = web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from("pda"),
        (() => {
            const buf = Buffer.alloc(2);
            buf.writeUInt16LE(chain_id);
            return buf;
        })(),
        new web3_js_1.PublicKey(caller).toBuffer(),
    ], new web3_js_1.PublicKey(program.programId));
    console.log(tempKey.toBase58(), bump);
    const ix = program.methods
        .receiveMessage([...vaa.hash], bump, chain_id, new web3_js_1.PublicKey(caller).toBuffer())
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
    const tx3 = new web3_js_1.Transaction().add(await ix);
    let signature = "";
    try {
        let commitment = 'confirmed';
        signature = await (0, web3_js_1.sendAndConfirmTransaction)(connection, tx3, [adminKeypair], { commitment });
        console.log('Transaction successful, txid:' + signature);
        executed = true;
    }
    catch (error) {
        console.error('Transaction failed:', error);
        console.log(error);
    }
    return [executed, signature];
}
exports.processSepoliaToSolana = processSepoliaToSolana;
async function processSolanaToSepolia(signer, contractAbi, ctx) {
    let executed = false;
    const contract = new ethers_1.ethers.Contract(consts_1.RELAYER_SEPOLIA_PROGRAM, contractAbi["abi"], signer.provider);
    let hash = "";
    try {
        const contractWithWallet = contract.connect(signer);
        const tx = await contractWithWallet.receiveMessage(ctx.vaaBytes);
        hash = tx.hash;
        await tx.wait();
        console.log("Transaction successful");
        executed = true;
    }
    catch (error) {
        console.error("Transaction failed:", error);
    }
    return [executed, hash];
}
exports.processSolanaToSepolia = processSolanaToSepolia;
//# sourceMappingURL=controller.js.map