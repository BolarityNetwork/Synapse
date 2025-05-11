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
import {
    createAssociatedTokenAccountInstruction,
    createMint,
    getAssociatedTokenAddress,
    mintTo
} from "@solana/spl-token";
import {expect} from "chai";
import BN from "bn.js";

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

    const nft_idl = JSON.parse(
        require("fs").readFileSync(currentDirectory + "/target/idl/nft_verification.json", "utf8")
    );
    const nftProgramID=new PublicKey("6QBQwCw7gYQGb4aTW5Hxexcms24AnJRyU9pBCKhDLNSq")
    const programVerification = new anchor.Program(nft_idl, nftProgramID);

  const HELLO_WORLD_PID = program.programId;

  const NETWORK = "TESTNET";
  const WORMHOLE_CONTRACTS = CONTRACTS[NETWORK];
  const CORE_BRIDGE_PID = new PublicKey(WORMHOLE_CONTRACTS.solana.core);
  const realConfig = deriveAddress([Buffer.from("config")], HELLO_WORLD_PID);
  // const realForeignEmitterChain = CHAINS.base_sepolia;
  // const realForeignEmitterAddress = Buffer.alloc(32);
  // realForeignEmitterAddress.set(hexStringToUint8Array('0x232A9b207A1B91d527C300d5fD47778F60596Eb8'), 12);
  // const realForeignEmitter = deriveAddress(
  //     [
  //       Buffer.from("foreign_emitter"),
  //       (() => {
  //         const buf = Buffer.alloc(2);
  //         buf.writeUInt16LE(realForeignEmitterChain);
  //         return buf;
  //       })(),
  //     ],
  //     HELLO_WORLD_PID
  // );

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

    // const NFT_CONTRACT = "0x0753e3291FE2d6876f2Bb26E342D31445AEBEC78";
    let commitment: Commitment = 'confirmed';
    // const seeds = [Buffer.from("state")];
    // const [statePda, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
    //     seeds,
    //     programVerification.programId);
  const helloMessage = hexStringToUint8Array("0xfe0100000001271200000000000000000000000000000000000000000000000057e7e02bc1a9d9b0df22583439844e903278aecd801bf6d8415984099a1be8b200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000080000000000000000000000000190a350e055f8713f18edf2d0bd3d79a548e02220000000000000000000000000000000000000000000000000000704892a14a0000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000");
    // const tokenID = 1;
  //   let idBuf = Buffer.alloc(8);
  //   idBuf.writeBigUint64BE(BigInt(tokenID));
  //   const proxyAddressBuf = Buffer.from(hexStringToUint8Array('0x8aC04a8869DaaeA57b7C37452ff5255D6Fd8c6c5')); // your proxy evm address
  //   const chainIdBuf = Buffer.alloc(2);
  //   chainIdBuf.writeUInt16LE(realForeignEmitterChain);
  //   const payloadBuf = Buffer.concat([
  //       proxyAddressBuf,
  //       Buffer.from(hexStringToUint8Array(NFT_CONTRACT)), // NFT_CONTRACT
  //       idBuf,
  //       Buffer.alloc(32),
  //       programID.toBuffer(),
  //       chainIdBuf,
  //   ]);
  //   const [proofRecordPda] = PublicKey.findProgramAddressSync(
  //       [Buffer.from("proof"), payloadBuf.slice(20,40), payloadBuf.slice(40,48)],
  //       programVerification.programId);
  //   let ix = await programVerification.methods.createProofRecord(payloadBuf).accounts({
  //       payer:provider.wallet.publicKey,
  //       state: statePda,
  //       proofRecord:proofRecordPda,
  //   }).instruction();
  //   let tx = new Transaction().add(await ix);
  //   try {
  //     await sendAndConfirmTransaction(provider.connection, tx, [provider.wallet.payer], {commitment});
  //       console.log("execute success");
  //   }
  //   catch (error: any) {
  //     console.log(error);
  //   }
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
    await sendAndConfirmTransaction(provider.connection, tx3, [provider.wallet.payer], {commitment});
  }
  catch (error: any) {
    console.log(error);
  }


    // const mint = new PublicKey("7XSrPHGyxhWvX5aD25twNu12jj2GVTJkPFTBfEhwkhEH");
    // const token_vault_ata = await getAssociatedTokenAddress(
    //     mint,
    //     statePda,
    //     true
    // );
    // console.log("token_vault_ata:", token_vault_ata.toBase58());
    // const receiver_ata = await getAssociatedTokenAddress(
    //     mint,
    //     provider.wallet.publicKey,
    //     false
    // );
    // let ix = createAssociatedTokenAccountInstruction(
    //     provider.wallet.publicKey,
    //     receiver_ata,
    //     provider.wallet.publicKey,
    //     mint
    // );
    // let tx = new Transaction().add(await ix);
    // try {
    //   await sendAndConfirmTransaction(provider.connection, tx, [provider.wallet.payer], {commitment});
    //     console.log("execute success");
    // }
    // catch (error: any) {
    //   console.log(error);
    // }
    // console.log("receiver_ata:", receiver_ata.toBase58());

    // // =======================claim token===================================
    // const tokenID = 1;
    // let idBuf = Buffer.alloc(8);
    // idBuf.writeBigUint64BE(BigInt(tokenID));
    //
    // const payloadBuf = Buffer.concat([
    //     Buffer.alloc(20),
    //     Buffer.from(hexStringToUint8Array(NFT_CONTRACT)), // nft contract
    //     idBuf,
    //     Buffer.alloc(32),
    // ]);
    // const [proofRecordPda] = PublicKey.findProgramAddressSync(
    //     [Buffer.from("proof"), payloadBuf.slice(20,40), payloadBuf.slice(40,48)],
    //     programVerification.programId);
    // let ix = await programVerification.methods.claimTokens().accounts({
    //     receiver:provider.wallet.publicKey,
    //     state: statePda,
    //     tokenVault:token_vault_ata,
    //     receiverTokenAccount:receiver_ata,
    //     proofRecord:proofRecordPda,
    // }).instruction();
    // let tx = new Transaction().add(await ix);
    // try {
    //   await sendAndConfirmTransaction(provider.connection, tx, [provider.wallet.payer], {commitment});
    //     console.log("execute success");
    // }
    // catch (error: any) {
    //   console.log(error);
    // }


    // console.log(programVerification.programId);
    // const token_amount_per_nft = new BN(1_000000000);
    // let ix = await programVerification.methods.initialize(token_amount_per_nft).accounts({
    //     admin:provider.wallet.publicKey,
    //     tokenMint: mint,
    //     tokenVault:token_vault_ata,
    //     state: statePda,
    // }).instruction();
    // let tx = new Transaction().add(await ix);
    // try {
    //   await sendAndConfirmTransaction(provider.connection, tx, [provider.wallet.payer], {commitment});
    //     console.log("execute success");
    // }
    // catch (error: any) {
    //   console.log(error);
    // }
    // const nft_contract = Buffer.from(hexStringToUint8Array(NFT_CONTRACT));
    // let ix = await programVerification.methods.setApprovedNft( [...nft_contract], true).accounts({
    //     admin:provider.wallet.publicKey,
    //     state: statePda,
    // }).instruction();
    // let tx = new Transaction().add(await ix);
    // try {
    //     await sendAndConfirmTransaction(provider.connection, tx, [provider.wallet.payer], {commitment});
    //     console.log("execute success");
    // }
    // catch (error: any) {
    //     console.log(error);
    // }
    // const emitterAddress = PublicKey.findProgramAddressSync([Buffer.from("emitter")], new PublicKey("EYcqMLNRMUkHvDMg2Jpng8R5HMeJgt8uX7q372omPVsD"))[0].toBuffer().toString("hex");
    // console.log(emitterAddress);

    // const solAddress = tryNativeToHexString(
    //     '5tFEXwUwpAzMXBWUSjQNWVfEh7gKbTc5hQMqBwi8jQ7k',
    //     1
    // );
    // console.log(solAddress);
};
