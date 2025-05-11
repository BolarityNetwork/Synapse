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
    const [relayerInfoPDA] = await genPDAAccount("relayer_info")
    const [poolPDA] = await genPDAAccount("pool")
    const [finaPoolPDA] = await genPDAAccount("final_pool")

    const user_keypair =  Keypair.generate();

    it("Is initialized!", async () => {
        await requestAirdrop(user_keypair);
        const authority =  new PublicKey("D66tZQAUQwKq9mFWUCwj6A9XM8or36q696Rim2hsPnW3");
        await program.methods.initialize(authority).accounts({
            config: configPDA,
            payer: pg.wallet.publicKey,
            relayer_info: relayerInfoPDA,
        }).rpc();
        // Reinitialization should generate an exception.
        try{
            await program.methods.initialize(authority).accounts({
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
        assert((await program.account.config.fetch(configPDA)).authority= authority);
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
        assert((await program.account.relayerInfo.fetch(relayerInfoPDA)).number= 1);
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
        assert((await program.account.relayerInfo.fetch(relayerInfoPDA)).number = 2);
        let relayer_list = (await program.account.relayerInfo.fetch(relayerInfoPDA)).relayerList
        assert(relayer_list[1].equals(user_keypair.publicKey))
    });

    it("Register transaction pool", async () => {
        // Only owner
        try {
            await program.methods.registerTxPool().accounts({
                config: configPDA,
                pool: poolPDA,
                finalPool:finaPoolPDA,
                owner: user_keypair.publicKey,
            }).signers([user_keypair]).rpc();
        } catch (error) {
        }
        await program.methods.registerTxPool().accounts({
            config: configPDA,
            pool: poolPDA,
            finalPool:finaPoolPDA,
            owner: pg.wallet.publicKey,
        }).rpc();

        assert((await program.account.transactionPool.fetch(poolPDA)).total.eq(new BN(0)));
        assert((await program.account.finalTransactionPool.fetch(finaPoolPDA)).total.eq(new BN(0)));
    });


    it("Submit transaction", async () => {
        let ext_sequence = (await program.account.transactionPool.fetch(poolPDA)).total;
        let sequence = 166;
        let chain = 1;
        let chain_address = Buffer.alloc(32).fill(1);
        let epoch = (await  pg.connection.getEpochInfo()).epoch;
        let state_root = Buffer.alloc(32).fill(2);
        let hash = Buffer.alloc(64).fill(1);

        let buf = Buffer.alloc(8);
        buf.writeBigUInt64LE(BigInt(epoch), 0);
        const [epochSequencePDA]=  PublicKey.findProgramAddressSync(
            [
                Buffer.from("epoch_sequence"), buf,
            ],
            program.programId
        );

        const [finalTxPDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("final_tx"), buf,
            ],
            program.programId
        );
        const buf1 = Buffer.alloc(8);
        buf1.writeBigUInt64LE(BigInt(sequence), 0);

        let chain_buf = Buffer.alloc(2);
        chain_buf.writeUInt16LE(chain);
        const [txPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('tx'), chain_buf, chain_address, buf1],
            program.programId
        )
        buf1.writeBigUInt64LE(BigInt(ext_sequence), 0);
        const [extTxPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('ext_tx'), buf1],
            program.programId
        )
        await program.methods.initExecuteTransaction(chain, Array.from(chain_address), new BN(sequence), new BN(ext_sequence),new BN(epoch), true, Array.from(hash)).accounts({
            config: configPDA,
            relayer_info: relayerInfoPDA,
            relayer: pg.wallet.publicKey,
            pool: poolPDA,
            transaction: txPDA,
            extTransaction: extTxPDA,
            epochSequence: epochSequencePDA,
            finalTransaction: finalTxPDA,
            pool: poolPDA,
        }).rpc();
        assert((await program.account.transactionPool.fetch(poolPDA)).total.eq(new BN(1)));
        assert((await program.account.transaction.fetch(txPDA)).sequence.eq(new BN(0)));
        assert((await program.account.transaction.fetch(txPDA)).status.executed);
        assert((await program.account.extendTransaction.fetch(extTxPDA)).sequence.eq(new BN(ext_sequence)));
        assert((await program.account.extendTransaction.fetch(extTxPDA)).emitterSequence.eq(new BN(sequence)));
        assert(Buffer.from((await program.account.extendTransaction.fetch(extTxPDA)).hash).equals(hash));

        await program.methods.finalizeTransaction(chain, Array.from(chain_address), new BN(sequence), true, Array.from(state_root)).accounts({
            config: configPDA,
            operator: pg.wallet.publicKey,
            transaction: txPDA,
        }).rpc();
        assert((await program.account.transaction.fetch(txPDA)).status.finality);
        assert(Buffer.from((await program.account.transaction.fetch(txPDA)).stateRoot).equals(state_root));

        const [unExecutedPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('un_executed'), chain_buf, chain_address],
            program.programId
        )
        await program.methods.pushToUnExecuted(chain, Array.from(chain_address), new BN(sequence)).accounts({
            config: configPDA,
            relayer: pg.wallet.publicKey,
            relayer_info: relayerInfoPDA,
            pool: unExecutedPDA,
        }).rpc();

        assert((await program.account.unExecutedTransactionPool.fetch(unExecutedPDA)).current.eq(new BN(sequence)));
    });
});
