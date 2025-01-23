import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {Keypair, PublicKey} from "@solana/web3.js";
import { RelayerHub } from "../target/types/relayer_hub";
import { expect,assert } from 'chai'
import { BN } from 'bn.js';

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

describe("relayer-hub", async() => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.RelayerHub as Program<RelayerHub>;

    const pg = program.provider as anchor.AnchorProvider;

    const requestAirdrop = async (mint_keypair:anchor.web3.Keypair) => {
        const signature = await pg.connection.requestAirdrop(
            mint_keypair.publicKey,
            5 * anchor.web3.LAMPORTS_PER_SOL
        );
        const { blockhash, lastValidBlockHeight } = await pg.connection.getLatestBlockhash();
        await pg.connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature
        });
    }

    const genPDAAccount = async (seed:string)=> {
        return PublicKey.findProgramAddressSync(
            [
                Buffer.from(seed)
            ],
            program.programId
        );
    }

    const [configPDA] = await genPDAAccount("config")
    const [relayerInfoPDA] = await genPDAAccount("relayer")

    const user_keypair =  Keypair.generate();

    it("Is initialized!", async () => {
        await requestAirdrop(user_keypair);

        // await program.methods.initialize().accounts({
        //     config: configPDA,
        //     payer: pg.wallet.publicKey,
        //     relayer_info: relayerInfoPDA,
        // }).rpc();
        // // Reinitialization should generate an exception.
        // try{
        //     await program.methods.initialize().accounts({
        //       config: configPDA,
        //       payer: pg.wallet.publicKey,
        //       relayer_info: relayerInfoPDA,
        //   }).rpc();
        // } catch (error) {
        //   return;
        // }
        // // The owner of the program is the creator.
        // assert((await program.account.config.fetch(configPDA)).owner.equals(pg.wallet.publicKey));
        // assert((await program.account.config.fetch(configPDA)).initialized);
        // assert((await program.account.config.fetch(configPDA)).txPoolNumber= 0);
    });
    //
    // it("Register relayer", async () => {
    //     const [relayerPDA] = PublicKey.findProgramAddressSync(
    //         [Buffer.from('relayer'), pg.wallet.publicKey.toBuffer()],
    //         program.programId
    //     )
    //     await program.methods.registerRelayer().accounts({
    //         config: configPDA,
    //         relayer_info: relayerInfoPDA,
    //         relayer: relayerPDA,
    //         payer: pg.wallet.publicKey,
    //     }).rpc();
    //     assert((await program.account.relayer.fetch(relayerPDA)).owner.equals(pg.wallet.publicKey));
    //     expect((await program.account.relayerInfo.fetch(relayerInfoPDA)).number= 1);
    //     let relayer_list = (await program.account.relayerInfo.fetch(relayerInfoPDA)).relayerList
    //     assert(relayer_list[0].equals(pg.wallet.publicKey))
    // });
    //
    // it("Register another relayer", async () => {
    //     const [relayerPDA] = PublicKey.findProgramAddressSync(
    //         [Buffer.from('relayer'), user_keypair.publicKey.toBuffer()],
    //         program.programId
    //     )
    //     await program.methods.registerRelayer().accounts({
    //         config: configPDA,
    //         relayer_info: relayerInfoPDA,
    //         relayer: relayerPDA,
    //         payer: user_keypair.publicKey,
    //     }).signers([user_keypair]).rpc();
    //     assert((await program.account.relayer.fetch(relayerPDA)).owner.equals(user_keypair.publicKey));
    //     expect((await program.account.relayerInfo.fetch(relayerInfoPDA)).number = 2);
    //     let relayer_list = (await program.account.relayerInfo.fetch(relayerInfoPDA)).relayerList
    //     assert(relayer_list[1].equals(user_keypair.publicKey))
    // });
    //
    // it("Register transaction pool", async () => {
    //     const chainID = 123
    //     const buf = Buffer.alloc(2);
    //     buf.writeUInt16LE(chainID);
    //     const [poolPDA] = PublicKey.findProgramAddressSync(
    //         [Buffer.from('pool'), buf],
    //         program.programId
    //     )
    //     await program.methods.registerTxPool(chainID).accounts({
    //         config: configPDA,
    //         pool: poolPDA,
    //         owner: pg.wallet.publicKey,
    //     }).rpc();
    //
    //     expect((await program.account.transactionPool.fetch(poolPDA)).total.eq(new BN(0)));
    //     expect((await program.account.transactionPool.fetch(poolPDA)).chain = chainID);
    //     expect((await program.account.transactionPool.fetch(poolPDA)).index = 0);
    // });
    //
    // it("Register another transaction pool", async () => {
    //     const chainID = 456
    //     const buf = Buffer.alloc(2);
    //     buf.writeUInt16LE(chainID);
    //     const [poolPDA] = PublicKey.findProgramAddressSync(
    //         [Buffer.from('pool'), buf],
    //         program.programId
    //     )
    //
    //     // Only owner
    //     try {
    //         await program.methods.registerTxPool(chainID).accounts({
    //             config: configPDA,
    //             pool: poolPDA,
    //             owner: user_keypair.publicKey,
    //         }).signers([user_keypair]).rpc();
    //     } catch (error) {
    //         return;
    //     }
    //     await program.methods.registerTxPool(chainID).accounts({
    //         config: configPDA,
    //         pool: poolPDA,
    //         owner: pg.wallet.publicKey,
    //     }).rpc();
    //
    //     expect((await program.account.transactionPool.fetch(poolPDA)).total.eq(new BN(0)));
    //     expect((await program.account.transactionPool.fetch(poolPDA)).chain = chainID);
    //     expect((await program.account.transactionPool.fetch(poolPDA)).index = 1);
    // });
    //
    // it("Submit transaction", async () => {
    //     const chainID = 123
    //     const buf = Buffer.alloc(2);
    //     buf.writeUInt16LE(chainID);
    //     const [poolPDA] = PublicKey.findProgramAddressSync(
    //         [Buffer.from('pool'), buf],
    //         program.programId
    //     )
    //     const sequence = 0
    //     const buf1 = Buffer.alloc(8);
    //     buf1.writeBigUInt64LE(BigInt(sequence), 0);
    //     const [txPDA] = PublicKey.findProgramAddressSync(
    //         [Buffer.from('tx'), buf1],
    //         program.programId
    //     )
    //     const transactionBuf = Buffer.from(hexStringToUint8Array("0x010000000001002a5d283a7c37d93184a693a612a41278559a7ddbe446bd4e5fc92024135d719b3d4a9ca5ca150fa256edb3280a9b58c70c2c62ae87511188078b2b3216b1928901676e11ff0000000000013b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca98000000000000758b20010000000000000000000000000000000000000000000000000000000000989680069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f000000000010001e8de75ef9e847ee05ed3d828e307b24c427e55b918ba81de3c0ae12570284afb00150000000000000000000000000000000000000000000000000000000000000000"))
    //     await program.methods.sendTransaction(chainID, new BN(sequence), transactionBuf).accounts({
    //         config: configPDA,
    //         relayer_info: relayerInfoPDA,
    //         relayer: pg.wallet.publicKey,
    //         transaction: txPDA,
    //         pool: poolPDA,
    //     }).rpc();
    //     assert((await program.account.transaction.fetch(txPDA)).data.equals(transactionBuf))
    //     expect((await program.account.transactionPool.fetch(poolPDA)).total.eq(new BN(1)));
    //     expect((await program.account.transaction.fetch(txPDA)).sequence.eq(new BN(0)));
    //     expect((await program.account.transaction.fetch(txPDA)).poolIndex = 0);
    // });
    //
    // it("Submit another transaction", async () => {
    //     const chainID = 123
    //     const buf = Buffer.alloc(2);
    //     buf.writeUInt16LE(chainID);
    //     const [poolPDA] = PublicKey.findProgramAddressSync(
    //         [Buffer.from('pool'), buf],
    //         program.programId
    //     )
    //     const sequence = 1
    //     const buf1 = Buffer.alloc(8);
    //     buf1.writeBigUInt64LE(BigInt(sequence), 0);
    //     const [txPDA] = PublicKey.findProgramAddressSync(
    //         [Buffer.from('tx'), buf1],
    //         program.programId
    //     )
    //     const transactionBuf = Buffer.from(hexStringToUint8Array("0x010000000001002a5d283a7c37d93184a693a612a41278559a7ddbe446bd4e5fc92024135d719b3d4a9ca5ca150fa256edb3280a9b58c70c2c62ae87511188078b2b3216b1928901676e11ff0000000000013b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca98000000000000758b20010000000000000000000000000000000000000000000000000000000000989680069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f000000000010001e8de75ef9e847ee05ed3d828e307b24c427e55b918ba81de3c0ae12570284afb00150000000000000000000000000000000000000000000000000000000000000000"))
    //     await program.methods.sendTransaction(chainID, new BN(sequence), transactionBuf).accounts({
    //         config: configPDA,
    //         relayer_info: relayerInfoPDA,
    //         relayer: pg.wallet.publicKey,
    //         transaction: txPDA,
    //         pool: poolPDA,
    //     }).rpc();
    //     assert((await program.account.transaction.fetch(txPDA)).data.equals(transactionBuf))
    //     expect((await program.account.transactionPool.fetch(poolPDA)).total.eq(new BN(2)));
    //     expect((await program.account.transaction.fetch(txPDA)).sequence.eq(new BN(1)));
    //     expect((await program.account.transaction.fetch(txPDA)).poolIndex = 1);
    // });
    //
    // it("Can not submit transaction", async () => {
    //     const chainID = 123
    //     const buf = Buffer.alloc(2);
    //     buf.writeUInt16LE(chainID);
    //     const [poolPDA] = PublicKey.findProgramAddressSync(
    //         [Buffer.from('pool'), buf],
    //         program.programId
    //     )
    //     const sequence = 2
    //     const buf1 = Buffer.alloc(8);
    //     buf1.writeBigUInt64LE(BigInt(sequence), 0);
    //     const [txPDA] = PublicKey.findProgramAddressSync(
    //         [Buffer.from('tx'), buf1],
    //         program.programId
    //     )
    //     const transactionBuf = Buffer.from(hexStringToUint8Array("0x010000000001002a5d283a7c37d93184a693a612a41278559a7ddbe446bd4e5fc92024135d719b3d4a9ca5ca150fa256edb3280a9b58c70c2c62ae87511188078b2b3216b1928901676e11ff0000000000013b26409f8aaded3f5ddca184695aa6a0fa829b0c85caf84856324896d214ca98000000000000758b20010000000000000000000000000000000000000000000000000000000000989680069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f000000000010001e8de75ef9e847ee05ed3d828e307b24c427e55b918ba81de3c0ae12570284afb00150000000000000000000000000000000000000000000000000000000000000000"))
    //     try{
    //         await program.methods.sendTransaction(chainID, new BN(sequence), transactionBuf).accounts({
    //             config: configPDA,
    //             relayer_info: relayerInfoPDA,
    //             relayer: user_keypair.publicKey,
    //             transaction: txPDA,
    //             pool: poolPDA,
    //         }).signers([user_keypair]).rpc();
    //     } catch (error) {
    //         return;
    //     }
    //     // Epoch switching can be executed
    //     let currentEpoch = await pg.connection.getEpochInfo();
    //     currentEpoch.epoch = 1
    //     await program.methods.sendTransaction(chainID, new BN(sequence), transactionBuf).accounts({
    //         config: configPDA,
    //         relayer_info: relayerInfoPDA,
    //         relayer: user_keypair.publicKey,
    //         transaction: txPDA,
    //         pool: poolPDA,
    //     }).signers([user_keypair]).rpc();
    // });
});
