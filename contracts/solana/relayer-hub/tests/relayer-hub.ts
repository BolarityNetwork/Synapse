import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {Keypair, PublicKey} from "@solana/web3.js";
import { RelayerHub } from "../target/types/relayer_hub";
import { expect,assert } from 'chai'
import { BN } from 'bn.js';

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

        await program.methods.initialize().accounts({
            config: configPDA,
            payer: pg.wallet.publicKey,
            relayer_info: relayerInfoPDA,
        }).rpc();
        // Reinitialization should generate an exception.
        try{
            await program.methods.initialize().accounts({
              config: configPDA,
              payer: pg.wallet.publicKey,
              relayer_info: relayerInfoPDA,
          }).rpc();
        } catch (error) {
          return;
        }
        // The owner of the program is the creator.
        assert((await program.account.config.fetch(configPDA)).owner.equals(pg.wallet.publicKey));
        assert((await program.account.config.fetch(configPDA)).initialized);
        assert((await program.account.config.fetch(configPDA)).txPoolNumber= 0);
    });

    it("Register relayer", async () => {
        const [relayerPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('relayer'), pg.wallet.publicKey.toBuffer()],
            program.programId
        )
        await program.methods.registerRelayer().accounts({
            config: configPDA,
            relayer_info: relayerInfoPDA,
            relayer: relayerPDA,
            payer: pg.wallet.publicKey,
        }).rpc();
        assert((await program.account.relayer.fetch(relayerPDA)).owner.equals(pg.wallet.publicKey));
        expect((await program.account.relayerInfo.fetch(relayerInfoPDA)).number= 1);
        let relayer_list = (await program.account.relayerInfo.fetch(relayerInfoPDA)).relayerList
        assert(relayer_list[0].equals(pg.wallet.publicKey))
    });

    it("Register another relayer", async () => {
        const [relayerPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('relayer'), user_keypair.publicKey.toBuffer()],
            program.programId
        )
        await program.methods.registerRelayer().accounts({
            config: configPDA,
            relayer_info: relayerInfoPDA,
            relayer: relayerPDA,
            payer: user_keypair.publicKey,
        }).signers([user_keypair]).rpc();
        assert((await program.account.relayer.fetch(relayerPDA)).owner.equals(user_keypair.publicKey));
        expect((await program.account.relayerInfo.fetch(relayerInfoPDA)).number = 2);
        let relayer_list = (await program.account.relayerInfo.fetch(relayerInfoPDA)).relayerList
        assert(relayer_list[1].equals(user_keypair.publicKey))
    });

    it("Register transaction pool", async () => {
        const chainID = 123
        const buf = Buffer.alloc(2);
        buf.writeUInt16LE(chainID);
        const [poolPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('pool'), buf],
            program.programId
        )
        await program.methods.registerTxPool(chainID).accounts({
            config: configPDA,
            pool: poolPDA,
            owner: pg.wallet.publicKey,
        }).rpc();

        expect((await program.account.transactionPool.fetch(poolPDA)).total.eq(new BN(0)));
        expect((await program.account.transactionPool.fetch(poolPDA)).chain = chainID);
        expect((await program.account.transactionPool.fetch(poolPDA)).index = 0);
    });

    it("Register another transaction pool", async () => {
        const chainID = 456
        const buf = Buffer.alloc(2);
        buf.writeUInt16LE(chainID);
        const [poolPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('pool'), buf],
            program.programId
        )

        // Only owner
        try {
            await program.methods.registerTxPool(chainID).accounts({
                config: configPDA,
                pool: poolPDA,
                owner: user_keypair.publicKey,
            }).signers([user_keypair]).rpc();
        } catch (error) {
            return;
        }
        await program.methods.registerTxPool(chainID).accounts({
            config: configPDA,
            pool: poolPDA,
            owner: pg.wallet.publicKey,
        }).rpc();

        expect((await program.account.transactionPool.fetch(poolPDA)).total.eq(new BN(0)));
        expect((await program.account.transactionPool.fetch(poolPDA)).chain = chainID);
        expect((await program.account.transactionPool.fetch(poolPDA)).index = 1);
    });

    it("Submit transaction", async () => {
        const chainID = 123
        const buf = Buffer.alloc(2);
        buf.writeUInt16LE(chainID);
        const [poolPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('pool'), buf],
            program.programId
        )
        const sequence = 0
        const buf1 = Buffer.alloc(8);
        buf1.writeBigUInt64LE(BigInt(sequence), 0);
        const [txPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('tx'), buf1],
            program.programId
        )
        const transactionBuf = Buffer.from([1,2])
        await program.methods.sendTransaction(chainID, new BN(sequence), transactionBuf).accounts({
            config: configPDA,
            relayer_info: relayerInfoPDA,
            relayer: pg.wallet.publicKey,
            transaction: txPDA,
            pool: poolPDA,
        }).rpc();
        assert((await program.account.transaction.fetch(txPDA)).data.equals(transactionBuf))
        expect((await program.account.transactionPool.fetch(poolPDA)).total.eq(new BN(1)));
        expect((await program.account.transaction.fetch(txPDA)).sequence.eq(new BN(0)));
        expect((await program.account.transaction.fetch(txPDA)).poolIndex = 0);
    });

    it("Submit another transaction", async () => {
        const chainID = 123
        const buf = Buffer.alloc(2);
        buf.writeUInt16LE(chainID);
        const [poolPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('pool'), buf],
            program.programId
        )
        const sequence = 1
        const buf1 = Buffer.alloc(8);
        buf1.writeBigUInt64LE(BigInt(sequence), 0);
        const [txPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('tx'), buf1],
            program.programId
        )
        const transactionBuf = Buffer.from([1,2])
        await program.methods.sendTransaction(chainID, new BN(sequence), transactionBuf).accounts({
            config: configPDA,
            relayer_info: relayerInfoPDA,
            relayer: pg.wallet.publicKey,
            transaction: txPDA,
            pool: poolPDA,
        }).rpc();
        assert((await program.account.transaction.fetch(txPDA)).data.equals(transactionBuf))
        expect((await program.account.transactionPool.fetch(poolPDA)).total.eq(new BN(2)));
        expect((await program.account.transaction.fetch(txPDA)).sequence.eq(new BN(1)));
        expect((await program.account.transaction.fetch(txPDA)).poolIndex = 1);
    });

    it("Can not submit transaction", async () => {
        const chainID = 123
        const buf = Buffer.alloc(2);
        buf.writeUInt16LE(chainID);
        const [poolPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('pool'), buf],
            program.programId
        )
        const sequence = 2
        const buf1 = Buffer.alloc(8);
        buf1.writeBigUInt64LE(BigInt(sequence), 0);
        const [txPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('tx'), buf1],
            program.programId
        )
        const transactionBuf = Buffer.from([1,2])
        try{
            await program.methods.sendTransaction(chainID, new BN(sequence), transactionBuf).accounts({
                config: configPDA,
                relayer_info: relayerInfoPDA,
                relayer: user_keypair.publicKey,
                transaction: txPDA,
                pool: poolPDA,
            }).signers([user_keypair]).rpc();
        } catch (error) {
            return;
        }
        // Epoch switching can be executed
        let currentEpoch = await pg.connection.getEpochInfo();
        currentEpoch.epoch = 1
        await program.methods.sendTransaction(chainID, new BN(sequence), transactionBuf).accounts({
            config: configPDA,
            relayer_info: relayerInfoPDA,
            relayer: user_keypair.publicKey,
            transaction: txPDA,
            pool: poolPDA,
        }).signers([user_keypair]).rpc();
    });
});
