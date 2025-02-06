import { Connection, Keypair, PublicKey,Transaction, sendAndConfirmTransaction, Commitment, SystemProgram } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
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

const genTxPDAAccount = async (program:Program<RelayerHub>, sequence:number)=> {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(sequence), 0);
  return PublicKey.findProgramAddressSync(
      [
        Buffer.from(TX_SEED), buf,
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

export async function get_relayer_of_current_epoch(connection:Connection, program:Program<RelayerHub>) {
    // const slotInfo = await connection.getSlot();
    // console.log(`current slot: ${slotInfo}`);
    const epochInfo = await connection.getEpochInfo();
    const epoch = epochInfo.epoch;
    console.log(`current epoch: ${epochInfo.epoch}`);

    const [relayerInfoPDA] = await genPDAAccount(program, RELAYER_INFO_SEED);
    let relayerList = (await program.account.relayerInfo.fetch(relayerInfoPDA)).relayerList;
    let totalRelayer = relayerList.length;
    let currentRelayer = relayerList[epoch%totalRelayer];
    return currentRelayer;
}

async function get_sequence(program:Program<RelayerHub>) {

  const [poolPDA] = await genPDAAccount(program, POOL_SEED)

  let sequence = (await program.account.transactionPool.fetch(poolPDA)).total;

  return sequence.toNumber();
}

export async function init_transaction(connection:Connection, program:Program<RelayerHub>, data:Buffer, relayer_keypair:Keypair) {

  let sequence = await get_sequence(program);

  const [configPDA] = await genPDAAccount(program, CONFIG_SEED);

  const [relayerInfoPDA] = await genPDAAccount(program, RELAYER_INFO_SEED);

  const [poolPDA] = await genPDAAccount(program, POOL_SEED);

  const [txPDA] = await genTxPDAAccount(program, sequence);

  const epochInfo = await connection.getEpochInfo();
  const epoch = epochInfo.epoch;

  const [epochSequencePDA] = await genEpochSequencePDAAccount(program, epoch);

  const [finalTxPDA] = await genFinalTxPDAAccount(program, epoch);

  const ix = program.methods
      .initTransaction(new BN(sequence), new BN(epoch), data)
      .accountsPartial({
        relayer:relayer_keypair.publicKey,
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
      let signature = await sendAndConfirmTransaction(connection, tx, [relayer_keypair], {commitment});
      console.log("Excute successfully! tx:" + signature);
    }
    catch (error: any) {
      console.log("Excute failed:" + error);
    }
    return sequence;
}

export async function execute_transaction(connection:Connection, program:Program<RelayerHub>, sequence:number, success:boolean, relayer_keypair:Keypair, hash:Buffer) {

  const [configPDA] = await genPDAAccount(program, CONFIG_SEED);

  const [relayerInfoPDA] = await genPDAAccount(program, RELAYER_INFO_SEED);

  const [txPDA] = await genTxPDAAccount(program, sequence);

  const ix = program.methods
      .executeTransaction(new BN(sequence), success, Array.from(hash))
      .accountsPartial({
        relayer:relayer_keypair.publicKey,
        config: configPDA,
        relayerInfo: relayerInfoPDA,
        transaction: txPDA,
      })
      .instruction();
    const tx = new Transaction().add(await ix);
    try {
      let commitment: Commitment = 'confirmed';
      let signature = await sendAndConfirmTransaction(connection, tx, [relayer_keypair], {commitment});
      console.log("Excute successfully! tx:" + signature);
    }
    catch (error: any) {
      console.log(error);
    }
}