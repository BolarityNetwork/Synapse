// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import { CHAINS, ChainId, parseVaa, CONTRACTS,
    CHAIN_ID_SOLANA,
    tryNativeToHexString,
} from "@certusone/wormhole-sdk";
import {
  deriveAddress,
  getPostMessageCpiAccounts,
} from "@certusone/wormhole-sdk/lib/cjs/solana";
import { getProgramSequenceTracker } from "@certusone/wormhole-sdk/lib/cjs/solana/wormhole";
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
import path from 'path';

const anchor = require("@coral-xyz/anchor");

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);
  const currentDirectory = process.cwd();

  const idl = JSON.parse(
      require("fs").readFileSync(currentDirectory + "/target/idl/hackathon.json", "utf8")
  );
  const programID=new PublicKey("CLErExd7gNADvu5rDFmkFD1uAt7zksJ3TDfXsJqJ4QTs")
  const program = new anchor.Program(idl, programID);

    const idlTest = JSON.parse(
        require("fs").readFileSync(currentDirectory + "/target/idl/test.json", "utf8")
    );
    const programIDTest=new PublicKey("DViLwexyLUuKRRXWCQgFYqzoVLWktEbvUVhzKNZ7qTSF")
    const programTest = new anchor.Program(idlTest, programIDTest);

  const HELLO_WORLD_PID = program.programId;

  const NETWORK = "TESTNET";
  const WORMHOLE_CONTRACTS = CONTRACTS[NETWORK];
  const CORE_BRIDGE_PID = new PublicKey(WORMHOLE_CONTRACTS.solana.core);
  const userKeypair = Keypair.fromSecretKey(
      bs58.decode(''));

  const adminKeypair = Keypair.fromSecretKey(
      bs58.decode(''));
  const realForeignEmitterChain = CHAINS.bsc;
  // const realForeignEmitterAddress = Buffer.alloc(32, "abcd", "hex");
     const realForeignEmitterAddress = Buffer.from([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x87,0xa5,0xe9,0x39,0xb4,0xf0,0x2b,0x76,0xea,0xb6,0xfd,0x01,0x2f,0x80,0xf1,0xbb,0x69,0xc4,0x3a,0x97])
    // const realForeignEmitterAddress = Buffer.from([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x7E,0x34,0xca,0xa0,0x6F,0x51,0x32,0xD2,0xBc,0x65,0x68,0xf8,0x83,0x3d,0xD0,0xe6,0x7d,0x01,0x9F,0x40])
  const realConfig = deriveAddress([Buffer.from("config")], HELLO_WORLD_PID);
  const realForeignEmitter = deriveAddress(
      [
        Buffer.from("foreign_emitter"),
        (() => {
          const buf = Buffer.alloc(2);
          buf.writeUInt16LE(realForeignEmitterChain);
          return buf;
        })(),
      ],
      HELLO_WORLD_PID
  );
  console.log(CORE_BRIDGE_PID.toBase58())


  const message = deriveAddress(
      [
        Buffer.from("sent"),
        (() => {
          const buf = Buffer.alloc(8);
          buf.writeBigUInt64LE(1n);
          return buf;
        })(),
      ],
      HELLO_WORLD_PID
  );
  const wormholeAccounts = getPostMessageCpiAccounts(
      program.programId,
      CORE_BRIDGE_PID,
      adminKeypair.publicKey,
      message
  );

    const seeds = []
    const [myStorage, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, programTest.programId);

    // initialize
    const ix = programTest.methods
        .initialize()
        .accounts({
            signer: adminKeypair.publicKey,
            my_storage:myStorage,
        })
        .instruction();
      const tx = new Transaction().add(await ix);
      try {
        let commitment: Commitment = 'confirmed';
        await sendAndConfirmTransaction(provider.connection, tx, [adminKeypair], {commitment});
      }
      catch (error: any) {
        console.log(error);
      }
  // // initialize
  // const ix = program.methods
  //     .initialize()
  //     .accounts({
  //       owner: adminKeypair.publicKey,
  //       config: realConfig,
  //       wormholeProgram: CORE_BRIDGE_PID,
  //       ...wormholeAccounts,
  //     })
  //     .instruction();
  //   const tx = new Transaction().add(await ix);
  //   try {
  //     let commitment: Commitment = 'confirmed';
  //     await sendAndConfirmTransaction(provider.connection, tx, [adminKeypair], {commitment});
  //   }
  //   catch (error: any) {
  //     console.log(error);
  //   }

  // const ix2 = program.methods
  //     .registerEmitter(realForeignEmitterChain, [...realForeignEmitterAddress])
  //     .accounts({
  //       owner: adminKeypair.publicKey,
  //       config: realConfig,
  //       foreignEmitter: realForeignEmitter,
  //     })
  //     .instruction();
  // const tx2 = new Transaction().add(await ix2);
  // try {
  //   let commitment: Commitment = 'confirmed';
  //   await sendAndConfirmTransaction(provider.connection, tx2, [adminKeypair], {commitment});
  // }
  // catch (error: any) {
  //   console.log(error);
  // }
  // // console.log(await program.account.foreignEmitter.fetch(realForeignEmitterAddress))

  // // get sequence
  // const message2 = await getProgramSequenceTracker(provider.connection, program.programId, CORE_BRIDGE_PID)
  //     .then((tracker) =>
  //         deriveAddress(
  //             [
  //               Buffer.from("sent"),
  //               (() => {
  //                 const buf = Buffer.alloc(8);
  //                 buf.writeBigUInt64LE(tracker.sequence + 1n);
  //                 return buf;
  //               })(),
  //             ],
  //             HELLO_WORLD_PID
  //         )
  //     );
  // const wormholeAccounts2 = getPostMessageCpiAccounts(
  //     program.programId,
  //     CORE_BRIDGE_PID,
  //     adminKeypair.publicKey,
  //     message2
  // );
  // const helloMessage = Buffer.from("All your base are belong to us");
  // const ix3 = program.methods
  //     .sendMessage(helloMessage)
  //     .accounts({
  //       config: realConfig,
  //       wormholeProgram: CORE_BRIDGE_PID,
  //       ...wormholeAccounts2,
  //     })
  //     .instruction();
  // const tx3 = new Transaction().add(await ix3);
  // try {
  //   let commitment: Commitment = 'confirmed';
  //   await sendAndConfirmTransaction(provider.connection, tx3, [adminKeypair], {commitment});
  // }
  // catch (error: any) {
  //   console.log(error);
  // }
  //   const targetContractAddressHex =
  //       "0x" + tryNativeToHexString("CLErExd7gNADvu5rDFmkFD1uAt7zksJ3TDfXsJqJ4QTs", CHAIN_ID_SOLANA);
  //   console.log(targetContractAddressHex);
};
