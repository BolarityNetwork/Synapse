import { PublicKey,Transaction, sendAndConfirmTransaction, Commitment } from '@solana/web3.js';
import anchor, { Program } from "@coral-xyz/anchor";
import {
	RELAYER_INFO_SEED,
  RELAYER_SEED,
  POOL_SEED,
  CONFIG_SEED,
  TX_SEED,
  EPOCH_SEQUENCE_SEED,
  FINAL_TX_SEED,
} from "./consts"
import { BN } from 'bn.js';
import {RelayerHub} from "../types/relayer_hub";
import { NodeWallet } from "@certusone/wormhole-sdk/lib/cjs/solana";
import { number } from "yargs";

const genPDAAccount = async (program:Program<RelayerHub>, seed:string)=> {
    return PublicKey.findProgramAddressSync(
        [
          Buffer.from(seed)
        ],
        program.programId
    );
}

const genRelayerPDAAccount = async (program:Program<RelayerHub>, relayer:PublicKey)=> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(RELAYER_SEED), relayer.toBuffer(),
      ],
      program.programId
    );
}

const genTxPDAAccount = async (program:Program<RelayerHub>, chain:number, chain_address:Buffer, sequence:number)=> {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(sequence), 0);
    const chainBuf = Buffer.alloc(2);
    chainBuf.writeUint16LE(chain);
    const address = Buffer.alloc(32);
    chain_address.copy(address);
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(TX_SEED), chainBuf, address,  buf,
      ],
      program.programId
    );
}

const genEpochSequencePDAAccount = async (program:Program<RelayerHub>, epoch:number)=> {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(epoch), 0);
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(EPOCH_SEQUENCE_SEED), buf,
      ],
      program.programId
    );
}


const genFinalTxPDAAccount = async (program:Program<RelayerHub>, epoch:number)=> {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(epoch), 0);
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(FINAL_TX_SEED), buf,
      ],
      program.programId
    );
}

export async function check_tx_exist(program:Program<RelayerHub>, chain:number, chain_address:Buffer, sequence:number) {
    const [txPDA] = await genTxPDAAccount(program, chain, chain_address, sequence);
    let epoch = 0;
    try {
        epoch = (await program.account.transaction.fetch(txPDA)).epoch.toNumber();
    } catch (error) {

    }
    return epoch != 0;
}


export async function get_relayer_of_current_epoch(program:Program<RelayerHub>) {
    // const slotInfo = await connection.getSlot();
    // console.log(`current slot: ${slotInfo}`);
    const provider = program.provider as anchor.AnchorProvider;

    const connection = provider.connection;

    const epochInfo = await connection.getEpochInfo();
    const epoch = epochInfo.epoch;
    console.log(`current epoch: ${epochInfo.epoch}`);

    const [relayerInfoPDA] = await genPDAAccount(program, RELAYER_INFO_SEED);
    let relayerList = (await program.account.relayerInfo.fetch(relayerInfoPDA)).relayerList;
    let totalRelayer = relayerList.length;
    let currentRelayer = relayerList[epoch%totalRelayer];
    return currentRelayer;
}

export async function init_execute_transaction(program:Program<RelayerHub>, chain:number, chain_address:Buffer, sequence:number, success:boolean, hash:Buffer) {
    const provider = program.provider as anchor.AnchorProvider;
    const wallet = provider.wallet as unknown as NodeWallet;

    const connection = provider.connection;


    const [configPDA] = await genPDAAccount(program, CONFIG_SEED);

    const [relayerInfoPDA] = await genPDAAccount(program, RELAYER_INFO_SEED);

    const [poolPDA] = await genPDAAccount(program, POOL_SEED);

    const [txPDA] = await genTxPDAAccount(program, chain, chain_address, sequence);

    const epochInfo = await connection.getEpochInfo();
    const epoch = epochInfo.epoch;

    const [epochSequencePDA] = await genEpochSequencePDAAccount(program, epoch);

    const [finalTxPDA] = await genFinalTxPDAAccount(program, epoch);

    const ix = program.methods
        .initExecuteTransaction(chain, Array.from(chain_address), new BN(sequence), new BN(epoch), success, Array.from(hash))
        .accountsPartial({
            relayer: wallet.publicKey(),
            config: configPDA,
            relayerInfo: relayerInfoPDA,
            pool: poolPDA,
            transaction: txPDA,
            epochSequence: epochSequencePDA,
            finalTransaction: finalTxPDA,
        })
        .instruction();
    const tx = new Transaction().add(await ix);
    try {
        let commitment: Commitment = 'confirmed';
        let signature = await sendAndConfirmTransaction(connection, tx, [wallet.payer], {commitment});
        console.log("Init execute transaction instruction execute successfully! tx:" + signature);
    }
    catch (error: any) {
        console.log("Init execute transaction instruction execute failed:" + error);
    }
}