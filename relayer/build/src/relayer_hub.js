"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute_transaction = exports.init_transaction = exports.get_relayer_of_current_epoch = void 0;
const web3_js_1 = require("@solana/web3.js");
const consts_1 = require("./consts");
const bn_js_1 = require("bn.js");
const genPDAAccount = async (program, seed) => {
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from(seed)
    ], program.programId);
};
const genRelayerPDAAccount = async (program, relayer) => {
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from(consts_1.RELAYER_SEED), relayer.toBuffer(),
    ], program.programId);
};
const genTxPDAAccount = async (program, sequence) => {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(sequence), 0);
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from(consts_1.TX_SEED), buf,
    ], program.programId);
};
const genEpochSequencePDAAccount = async (program, epoch) => {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(epoch), 0);
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from(consts_1.EPOCH_SEQUENCE_SEED), buf,
    ], program.programId);
};
const genFinalTxPDAAccount = async (program, epoch) => {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(epoch), 0);
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from(consts_1.FINAL_TX_SEED), buf,
    ], program.programId);
};
async function get_relayer_of_current_epoch(connection, program) {
    // const slotInfo = await connection.getSlot();
    // console.log(`current slot: ${slotInfo}`);
    const epochInfo = await connection.getEpochInfo();
    const epoch = epochInfo.epoch;
    console.log(`current epoch: ${epochInfo.epoch}`);
    const [relayerInfoPDA] = await genPDAAccount(program, consts_1.RELAYER_INFO_SEED);
    let relayerList = (await program.account.relayerInfo.fetch(relayerInfoPDA)).relayerList;
    let totalRelayer = relayerList.length;
    let currentRelayer = relayerList[epoch % totalRelayer];
    return currentRelayer;
}
exports.get_relayer_of_current_epoch = get_relayer_of_current_epoch;
async function get_sequence(program) {
    const [poolPDA] = await genPDAAccount(program, consts_1.POOL_SEED);
    let sequence = (await program.account.transactionPool.fetch(poolPDA)).total;
    return sequence.toNumber();
}
async function init_transaction(connection, program, data, relayer_keypair) {
    let sequence = await get_sequence(program);
    const [configPDA] = await genPDAAccount(program, consts_1.CONFIG_SEED);
    const [relayerInfoPDA] = await genPDAAccount(program, consts_1.RELAYER_INFO_SEED);
    const [poolPDA] = await genPDAAccount(program, consts_1.POOL_SEED);
    const [txPDA] = await genTxPDAAccount(program, sequence);
    const epochInfo = await connection.getEpochInfo();
    const epoch = epochInfo.epoch;
    const [epochSequencePDA] = await genEpochSequencePDAAccount(program, epoch);
    const [finalTxPDA] = await genFinalTxPDAAccount(program, epoch);
    const ix = program.methods
        .initTransaction(new bn_js_1.BN(sequence), new bn_js_1.BN(epoch), data)
        .accountsPartial({
        relayer: relayer_keypair.publicKey,
        config: configPDA,
        relayerInfo: relayerInfoPDA,
        pool: poolPDA,
        transaction: txPDA,
        epochSequence: epochSequencePDA,
        finalTransaction: finalTxPDA,
    })
        .instruction();
    const tx = new web3_js_1.Transaction().add(await ix);
    try {
        let commitment = 'confirmed';
        let signature = await (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [relayer_keypair], { commitment });
        console.log("Excute successfully! tx:" + signature);
    }
    catch (error) {
        console.log("Excute failed:" + error);
    }
    return sequence;
}
exports.init_transaction = init_transaction;
async function execute_transaction(connection, program, sequence, success, relayer_keypair, hash) {
    const [configPDA] = await genPDAAccount(program, consts_1.CONFIG_SEED);
    const [relayerInfoPDA] = await genPDAAccount(program, consts_1.RELAYER_INFO_SEED);
    const [txPDA] = await genTxPDAAccount(program, sequence);
    const ix = program.methods
        .executeTransaction(new bn_js_1.BN(sequence), success, Array.from(hash))
        .accountsPartial({
        relayer: relayer_keypair.publicKey,
        config: configPDA,
        relayerInfo: relayerInfoPDA,
        transaction: txPDA,
    })
        .instruction();
    const tx = new web3_js_1.Transaction().add(await ix);
    try {
        let commitment = 'confirmed';
        let signature = await (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [relayer_keypair], { commitment });
        console.log("Excute successfully! tx:" + signature);
    }
    catch (error) {
        console.log(error);
    }
}
exports.execute_transaction = execute_transaction;
//# sourceMappingURL=relayer_hub.js.map