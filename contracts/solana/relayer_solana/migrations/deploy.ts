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
function hexStringToUint8Array(hexString: string): Uint8Array {
  if (hexString.startsWith("0x")) {
    hexString = hexString.slice(2);
  }

  if (hexString.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }

  const byteArray = new Uint8Array(hexString.length / 2);

  for (let i = 0; i < hexString.length; i += 2) {
    const hexPair = hexString.slice(i, i + 2);
    byteArray[i / 2] = parseInt(hexPair, 16);
  }

  return byteArray;
}
module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  const currentDirectory = process.cwd();

  const idl = JSON.parse(
      require("fs").readFileSync(currentDirectory + "/target/idl/relayer_solana.json", "utf8")
  );
  const programID=new PublicKey("5tFEXwUwpAzMXBWUSjQNWVfEh7gKbTc5hQMqBwi8jQ7k")
  const program = new anchor.Program(idl, programID);

  const HELLO_WORLD_PID = program.programId;

  const NETWORK = "TESTNET";
  const WORMHOLE_CONTRACTS = CONTRACTS[NETWORK];
  const CORE_BRIDGE_PID = new PublicKey(WORMHOLE_CONTRACTS.solana.core);

  const realForeignEmitterChain = CHAINS.sepolia;
  const realForeignEmitterAddress = Buffer.from([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0xeb,0x48,0x5a,0x2B,0xF3,0x56,0x76,0x52,0x18,0x56,0x17,0xB6,0x47,0xd1,0x25,0xa1,0x4D,0xb5,0x90,0x7e])
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

  // const message = deriveAddress(
  //     [
  //       Buffer.from("sent"),
  //       (() => {
  //         const buf = Buffer.alloc(8);
  //         buf.writeBigUInt64LE(1n);
  //         return buf;
  //       })(),
  //     ],
  //     HELLO_WORLD_PID
  // );
  // const wormholeAccounts = getPostMessageCpiAccounts(
  //     program.programId,
  //     CORE_BRIDGE_PID,
  //     provider.wallet.publicKey,
  //     message
  // );
  // // initialize
  // const ix = program.methods
  //     .initialize()
  //     .accounts({
  //       owner: provider.wallet.publicKey,
  //       config: realConfig,
  //       wormholeProgram: CORE_BRIDGE_PID,
  //       ...wormholeAccounts,
  //     })
  //     .instruction();
  //   const tx = new Transaction().add(await ix);
  //   try {
  //     let commitment: Commitment = 'confirmed';
  //     await sendAndConfirmTransaction(provider.connection, tx, [provider.wallet.payer], {commitment});
  //   }
  //   catch (error: any) {
  //     console.log(error);
  //   }

  // const ix2 = program.methods
  //     .registerEmitter(realForeignEmitterChain, [...realForeignEmitterAddress])
  //     .accounts({
  //       owner: provider.wallet.publicKey,
  //       config: realConfig,
  //       foreignEmitter: realForeignEmitter,
  //     })
  //     .instruction();
  // const tx2 = new Transaction().add(await ix2);
  // try {
  //   let commitment: Commitment = 'confirmed';
  //   await sendAndConfirmTransaction(provider.connection, tx2, [provider.wallet.payer], {commitment});
  // }
  // catch (error: any) {
  //   console.log(error);
  // }

  // get sequence
  const message2 = await getProgramSequenceTracker(provider.connection, program.programId, CORE_BRIDGE_PID)
      .then((tracker) =>
          deriveAddress(
              [
                Buffer.from("sent"),
                (() => {
                  const buf = Buffer.alloc(8);
                  buf.writeBigUInt64LE(tracker.sequence + 1n);
                  return buf;
                })(),
              ],
              HELLO_WORLD_PID
          )
      );
  const wormholeAccounts2 = getPostMessageCpiAccounts(
      program.programId,
      CORE_BRIDGE_PID,
      provider.wallet.publicKey,
      message2
  );
  const helloMessage = hexStringToUint8Array("0xfe0100000001271200000000000000000000000000000000000000000000000057e7e02bc1a9d9b0df22583439844e903278aecd801bf6d8415984099a1be8b2000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000");
  const ix3 = program.methods
      .sendMessage(Buffer.from(helloMessage))
      .accounts({
        config: realConfig,
        wormholeProgram: CORE_BRIDGE_PID,
        ...wormholeAccounts2,
      })
      .instruction();
  const tx3 = new Transaction().add(await ix3);
  try {
    let commitment: Commitment = 'confirmed';
    await sendAndConfirmTransaction(provider.connection, tx3, [provider.wallet.payer], {commitment});
  }
  catch (error: any) {
    console.log(error);
  }
};
