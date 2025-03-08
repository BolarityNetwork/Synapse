import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RelayerSolana } from "../target/types/relayer_solana";
import { Proxy } from "../target/types/proxy";
import { Test } from "../target/types/test";
import { Stake } from "../target/types/stake";
import { NftVerification } from "../target/types/nft_verification";
import {Commitment, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram} from "@solana/web3.js";
const borsh = require('borsh');
import { createHash } from 'crypto';
import {
    createMint,
    createAssociatedTokenAccount,
    mintTo,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID, getMint,
    createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import * as buffer from "buffer";
import * as bs58 from  "bs58";
import {deriveAddress} from "@certusone/wormhole-sdk/lib/cjs/solana";
import {expect} from "chai";
import BN from "bn.js";

describe("relayer_solana", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const programProxy = anchor.workspace.Proxy as Program<Proxy>;
  const programTest = anchor.workspace.Test as Program<Test>;
  const programHackathon = anchor.workspace.RelayerSolana as Program<RelayerSolana>;
  const programStake = anchor.workspace.Stake as Program<Stake>;
  const programVerification = anchor.workspace.NftVerification as Program<NftVerification>;

  const pg = anchor.getProvider() as anchor.AnchorProvider;
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

    const requestAirdrop2 = async (pbkey:anchor.web3.PublicKey) => {
        const signature = await pg.connection.requestAirdrop(
            pbkey,
            5 * anchor.web3.LAMPORTS_PER_SOL
        );
        const { blockhash, lastValidBlockHeight } = await pg.connection.getLatestBlockhash();
        await pg.connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature
        });
    }
  async function printAccountBalance(account) {
        const balance = await pg.connection.getBalance(account);
        console.log(`${account} has ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
  }

  function sha256(input: string): Buffer {
        const hash = createHash('sha256');
        hash.update(input);
        return hash.digest();
  }
  const AccountMeta = {
        array: {
            type: {struct:{writeable:'bool', is_signer:'bool'}},
        }
  }
  const seeds = []
  const [myStorage, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, programTest.programId);
  const keypair = Keypair.generate();
  it("Is initialized!", async () => {
      const TestKeypair = Keypair.generate()
      await requestAirdrop(TestKeypair)
      await programTest.methods.initialize().accounts({signer:TestKeypair.publicKey, myStorage: myStorage}).signers([TestKeypair]).rpc();
      await programTest.methods.set(2, 0).accounts({myStorage: myStorage}).rpc();
      let myStorageStruct = await programTest.account.myStorage.fetch(myStorage);
      console.log(myStorageStruct.data);
      console.log(programTest.programId.toBase58());
      await programProxy.methods.initialize().accounts({signer:TestKeypair.publicKey}).signers([TestKeypair]).rpc();

      const [PDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("pda"), keypair.publicKey.toBuffer()],
          programProxy.programId,
      );
      const paras = sha256("global:tet").slice(0, 8);
      const encodedParams = Buffer.concat([paras]);
      await programProxy.methods.test(Buffer.from(encodedParams)).accounts({programAccount: programTest.programId, signer2:keypair.publicKey, pdaAccount:PDA}).rpc();

  });
    const MyEnum = {
        enum: [
            {
                struct: {
                    CreateAccount :{
                        struct:{
                            lamports:'u64',
                            space:'u64',
                            owner:{ array: { type: 'u8', len: 32 } },
                        }
                    }
                },
            },
            {
                struct: {
                    Assign:{
                        struct: {
                            owner: {array: {type: 'u8', len: 32}},
                        }
                    }
                },
            },
            {
                struct: {
                    Transfer:{
                        struct: {
                            lamports: 'u64',
                        }
                    }
                },
            },
        ],
    };
    class MyParameters {
        value1: number;
        value2: number;

        constructor(value1: number, value2: number) {
            this.value1 = value1;
            this.value2 = value2;
        }
    }
    // class Transfer {
    //     value1: number;
    //
    //     constructor(value1: number) {
    //         this.value1 = value1;
    //     }
    // }
    const myParametersSchema ={ struct: {'value1':'u8', 'value2':'u8'}}
    const schema2 ={ struct: {'value1':'u64'}}
    it("Test1", async () => {
        await printAccountBalance(keypair.publicKey);

        // const encoded = borsh.serialize(MyEnum, {Transfer:{lamports:2000000000}});
        // const paras = sha256("state:transfer").slice(0, 8);
        // const encodedParams = Buffer.concat([paras, encoded]);
        // console.log(encodedParams)
        let encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:true},{writeable:true, is_signer:false}]);
        console.log(Buffer.from(encodeMeta))
        // await programProxy.methods.proxyCall(Buffer.from([2, 0, 0, 0, 0, 148, 53, 119, 0, 0, 0, 0]), Buffer.from(encodeMeta), 2).accounts({signer:pg.wallet.publicKey, programAccount: anchor.web3.SystemProgram.programId, account1: pg.wallet.publicKey, account2:keypair.publicKey, account3:Keypair.generate().publicKey}).rpc();
        let accountMeta1 = {pubkey: pg.wallet.publicKey, isWritable: true, isSigner: true};
        const accountMeta2 = {pubkey: keypair.publicKey, isWritable: true, isSigner: false};
        const accountMeta3 = {pubkey: Keypair.generate().publicKey, isWritable: true, isSigner: false};
        await programProxy.methods.proxyCall(Buffer.from([2, 0, 0, 0, 0, 148, 53, 119, 0, 0, 0, 0]), Buffer.from(encodeMeta), 2).accounts({programAccount: anchor.web3.SystemProgram.programId}).remainingAccounts([accountMeta1, accountMeta2, accountMeta3]).rpc();
        await printAccountBalance(keypair.publicKey);

        const params = new MyParameters(2, 1);
        const encoded = borsh.serialize(myParametersSchema, params);
        const paras = sha256("global:set").slice(0, 8);
        const encodedParams = Buffer.concat([paras, encoded]);
        console.log(encodedParams)
        encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:false}]);
        console.log(Buffer.from(encodeMeta))
        accountMeta1 = {pubkey: myStorage, isWritable: true, isSigner: false};
        await programProxy.methods.proxyCall(encodedParams, Buffer.from(encodeMeta), 1).accounts({programAccount: programTest.programId}).remainingAccounts([accountMeta1, accountMeta2, accountMeta3]).rpc();
        const myStorageStruct = await programTest.account.myStorage.fetch(myStorage);
        console.log(myStorageStruct.data);
    });
    const RawDataSchema = {
        struct:{
            chain_id:'u16',
            caller:{array: {type:'u8', len:32}},
            programId:{array: {type:'u8', len:32}},
            acc_count:'u8',
            accounts:{
                array: {
                    type: {
                        struct:{
                            key:{array: {type:'u8', len:32}},
                            isWritable:'bool',
                            isSigner:'bool'
                        }
                    },
                }
            },
            paras: {array: {type:'u8'}},
            acc_meta: {array: {type:'u8'}},
        }
    };
    it("Test2", async () => {
    const params = new MyParameters(2, 1);
    const encoded = borsh.serialize(myParametersSchema, params);
    const paras = sha256("global:set").slice(0, 8);
    const encodedParams = Buffer.concat([paras, encoded]);
    const encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:false}]);
    const RawData = {
        chain_id: 4,
        caller: new PublicKey(0).toBuffer(),
        programId:programTest.programId.toBuffer(),
        acc_count:1,
        accounts:[
            {
                key: myStorage.toBuffer(),
                isWritable:true,
                isSigner: false,
            }
        ],
        paras:encodedParams,
        acc_meta:Buffer.from(encodeMeta),
    };
    const RawDataEncoded = borsh.serialize(RawDataSchema, RawData);
    const exp_RawData = borsh.deserialize(RawDataSchema, RawDataEncoded);
    console.log(exp_RawData);

    const meta1 = exp_RawData.accounts[0];
    const accountMeta1 = {pubkey: new PublicKey(meta1.key), isWritable: meta1.isWritable, isSigner: meta1.isSigner};
    console.log(accountMeta1)
    const accountMeta2 = {pubkey: Keypair.generate().publicKey, isWritable: true, isSigner: false};
    const accountMeta3 = {pubkey: Keypair.generate().publicKey, isWritable: true, isSigner: false};
    await programProxy.methods.proxyCall(Buffer.from(exp_RawData.paras), Buffer.from(exp_RawData.acc_meta), exp_RawData.acc_count).accounts({programAccount: new PublicKey(exp_RawData.programId)}).remainingAccounts([accountMeta1, accountMeta2, accountMeta3]).rpc();
    const myStorageStruct = await programTest.account.myStorage.fetch(myStorage);
    console.log(myStorageStruct.data);
    });

    it("Test3", async () => {
        const params = new MyParameters(2, 2);
        const encoded = borsh.serialize(myParametersSchema, params);
        const paras = sha256("global:set").slice(0, 8);
        const encodedParams = Buffer.concat([paras, encoded]);
        const encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:false}]);
        const RawData = {
            chain_id: 4,
            caller: new PublicKey(0).toBuffer(),
            programId:programTest.programId.toBuffer(),
            acc_count:1,
            accounts:[
                {
                    key: myStorage.toBuffer(),
                    isWritable:true,
                    isSigner: false,
                }
            ],
            paras:encodedParams,
            acc_meta:Buffer.from(encodeMeta),
        };
        const RawDataEncoded = borsh.serialize(RawDataSchema, RawData);
        console.log(RawDataEncoded.toString())
        const exp_RawData = borsh.deserialize(RawDataSchema, RawDataEncoded);

        const meta1 = exp_RawData.accounts[0];
        const accountMeta1 = {pubkey: new PublicKey(meta1.key), isWritable: meta1.isWritable, isSigner: meta1.isSigner};
        const accountMeta2 = {pubkey: Keypair.generate().publicKey, isWritable: true, isSigner: false};
        const accountMeta3 = {pubkey: Keypair.generate().publicKey, isWritable: true, isSigner: false};
        await programProxy.methods.receiveMessage(Buffer.from(RawDataEncoded)).accounts({programAccount: new PublicKey(exp_RawData.programId)}).remainingAccounts([accountMeta1, accountMeta2, accountMeta3]).rpc();
    });


    it("Test4", async () => {
        const RawDataSchema = {
            struct:{
                chain_id:'u16',
                caller:{array: {type:'u8', len:32}},
                programId:{array: {type:'u8', len:32}},
                acc_count:'u8',
                accounts:{
                    array: {
                        type: {
                            struct:{
                                key:{array: {type:'u8', len:32}},
                                isWritable:'bool',
                                isSigner:'bool'
                            }
                        },
                    }
                },
                paras: {array: {type:'u8'}},
                acc_meta: {array: {type:'u8'}},
            }
        };
        const TestKeypair = Keypair.generate()
        await requestAirdrop(TestKeypair)
        // await programTest.methods.initialize().accounts({signer:TestKeypair.publicKey, myStorage: myStorage}).signers([TestKeypair]).rpc();
        // await programTest.methods.set(2, 0).accounts({myStorage: myStorage}).rpc();
        // let myStorageStruct = await programTest.account.myStorage.fetch(myStorage);
        const realForeignEmitterChain = 10002;
        const realForeignEmitterAddress = Buffer.from([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0xa5,0x50,0xC6,0x01,0x1D,0xfB,0xA4,0x92,0x5a,0xbE,0xb0,0xB4,0x81,0x04,0x06,0x26,0x82,0x87,0x0B,0xB8])
        const realForeignEmitter = deriveAddress(
            [
                Buffer.from("pda"),
                (() => {
                    const buf = Buffer.alloc(2);
                    buf.writeUInt16LE(realForeignEmitterChain);
                    return buf;
                })(),
                realForeignEmitterAddress,
            ],
            programHackathon.programId
        );
        // 0xFE | version (u8) | type (Parser Type, u8)|reserve (u8) | from chain(u16)| to chain(u16)| reserve(24 byte) | data (vec<u8>)
        const solanaChainId = 1;
        const evmChainId = 10002; // sepolia
        const solanaChainIdBuffer = Buffer.alloc(2);
        solanaChainIdBuffer.writeUInt16BE(solanaChainId);
        const evmChainIdBuffer = Buffer.alloc(2);
        evmChainIdBuffer.writeUInt16BE(evmChainId);
        const payloadHead = Buffer.concat([Buffer.from([0xFE, 0x01, 0x00, 0x00]),  evmChainIdBuffer, solanaChainIdBuffer, Buffer.alloc(24)]);

        let paras = sha256("active").slice(0, 8);
        let encodedParams = Buffer.concat([paras]);

        let encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:false}]);
        let RawData = {
            chain_id: realForeignEmitterChain,
            caller: new PublicKey(realForeignEmitterAddress).toBuffer(),
            programId: programHackathon.programId.toBuffer(),
            acc_count:1,
            accounts:[
                {
                    key: realForeignEmitter.toBuffer(),
                    isWritable:true,
                    isSigner: false,
                }
            ],
            paras:encodedParams,
            acc_meta:Buffer.from(encodeMeta),
        };
        let RawDataEncoded = borsh.serialize(RawDataSchema, RawData);
        let exp_RawData = borsh.deserialize(RawDataSchema, RawDataEncoded);

        let meta1 = exp_RawData.accounts[0];
        let accountMeta1 = {pubkey: new PublicKey(meta1.key), isWritable: meta1.isWritable, isSigner: false};
        let accountMeta2 = {pubkey: TestKeypair.publicKey, isWritable: true, isSigner: false};

        const [tempKey, bump] = PublicKey.findProgramAddressSync([
                Buffer.from("pda"),
                (() => {
                    const buf = Buffer.alloc(2);
                    buf.writeUInt16LE(realForeignEmitterChain);
                    return buf;
                })(),
                new PublicKey(realForeignEmitterAddress).toBuffer(),
            ],
            programHackathon.programId);
        await printAccountBalance(realForeignEmitter);
        await programHackathon.methods.receiveMessage2(Buffer.concat([payloadHead, Buffer.from(RawDataEncoded)]), bump, realForeignEmitterChain, realForeignEmitterAddress).accounts({payer:TestKeypair.publicKey, programAccount: new PublicKey(exp_RawData.programId)}).remainingAccounts([accountMeta1]).signers([TestKeypair]).rpc();
        await printAccountBalance(realForeignEmitter);
        await requestAirdrop2(realForeignEmitter)
        await printAccountBalance(realForeignEmitter);

        encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:true}, {writeable:true, is_signer:false}]);
        paras = sha256("transfer").slice(0, 8);
        let buf = Buffer.alloc(8);
        buf.writeBigUint64LE(BigInt(1000000000),0);
        encodedParams = Buffer.concat([paras, buf]);
        RawData = {
            chain_id: realForeignEmitterChain,
            caller: new PublicKey(realForeignEmitterAddress).toBuffer(),
            programId: programHackathon.programId.toBuffer(),
            acc_count:2,
            accounts:[
                {
                    key: realForeignEmitter.toBuffer(),
                    isWritable:true,
                    isSigner: true,
                },
                {
                    key: TestKeypair.publicKey.toBuffer(),
                    isWritable:true,
                    isSigner: false,
                }
            ],
            paras:encodedParams,
            acc_meta:Buffer.from(encodeMeta),
        };
        RawDataEncoded = borsh.serialize(RawDataSchema, RawData);
        exp_RawData = borsh.deserialize(RawDataSchema, RawDataEncoded);
        meta1 = exp_RawData.accounts[0];
        let meta2 = exp_RawData.accounts[1];
        accountMeta1 = {pubkey: new PublicKey(meta1.key), isWritable: meta1.isWritable, isSigner: false};
        accountMeta2 = {pubkey: new PublicKey(meta2.key), isWritable: meta2.isWritable, isSigner: false};
        await programHackathon.methods.receiveMessage2(Buffer.concat([payloadHead, Buffer.from(RawDataEncoded)]), bump, realForeignEmitterChain, realForeignEmitterAddress).accounts({payer:TestKeypair.publicKey, programAccount: new PublicKey(exp_RawData.programId)}).remainingAccounts([accountMeta1, accountMeta2]).signers([TestKeypair]).rpc();
        await printAccountBalance(realForeignEmitter);

        const mint_keypair = Keypair.generate();
        await requestAirdrop2(mint_keypair.publicKey);
        const seeds = [Buffer.from("state")];
        const [statePda, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
            seeds,
            programVerification.programId);
        const mint = await createMint(
            pg.connection,
            mint_keypair,
            mint_keypair.publicKey,
            null,
            9
        );
        const token_vault_ata = await getAssociatedTokenAddress(
            mint,
            statePda,
            true
        );

        const createATAIx = createAssociatedTokenAccountInstruction(
            mint_keypair.publicKey,
            token_vault_ata,
            statePda,
            mint
        );

        const tx = new anchor.web3.Transaction().add(createATAIx);
        await pg.sendAndConfirm(tx, [mint_keypair]);

        const mintAmount = BigInt(1000_000000000);
        await mintTo(
            pg.connection,
            mint_keypair,
            mint,
            token_vault_ata,
            mint_keypair.publicKey,
            mintAmount
        );
        const token_vault_ata_balance = await pg.connection.getTokenAccountBalance(token_vault_ata);
        expect(token_vault_ata_balance.value.amount).to.eq(mintAmount.toString());
        const token_amount_per_nft = new BN(1_000000000);
        await programVerification.methods.initialize(token_amount_per_nft).accounts({
            admin:TestKeypair.publicKey,
            tokenMint: mint,
            tokenVault:token_vault_ata,
            state: statePda,
        })
            .signers([TestKeypair]).rpc();
        const nft_contract = Buffer.alloc(20);
        await programVerification.methods.setApprovedNft( [...nft_contract], true).accounts({
            admin:TestKeypair.publicKey,
            state: statePda,
        })
            .signers([TestKeypair]).rpc();


        encodeMeta = borsh.serialize(AccountMeta, [
            {writeable:true, is_signer:true},
            {writeable:false, is_signer:false},
            {writeable:true, is_signer:false},
            {writeable:false, is_signer:false}]);

        paras = sha256("global:process_wormhole_message").slice(0, 8);
        const payloadSchema = {
            struct: {
                payload: {array: {type: 'u8'}},
            }
        }
        const receiver_keypair = Keypair.generate();
        const payload = Buffer.concat([Buffer.alloc(20), nft_contract, Buffer.alloc(32),receiver_keypair.publicKey.toBuffer()]);
        const [proofRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("proof"), payload.slice(20,40), payload.slice(64,72)],
            programVerification.programId);
        const paraEncode = borsh.serialize(payloadSchema, {payload:payload});
        encodedParams = Buffer.concat([paras, paraEncode]);
        RawData = {
            chain_id: realForeignEmitterChain,
            caller: new PublicKey(realForeignEmitterAddress).toBuffer(),
            programId: programVerification.programId.toBuffer(),
            acc_count:4,
            accounts:[
                {
                    key: realForeignEmitter.toBuffer(),
                    isWritable:true,
                    isSigner: true,
                },
                {
                    key: statePda.toBuffer(),
                    isWritable:false,
                    isSigner: false,
                },
                {
                    key: proofRecordPda.toBuffer(),
                    isWritable:true,
                    isSigner: false,
                },
                {
                    key: SystemProgram.programId.toBuffer(),
                    isWritable:false,
                    isSigner: false,
                }
            ],
            paras:encodedParams,
            acc_meta:Buffer.from(encodeMeta),
        };
        RawDataEncoded = borsh.serialize(RawDataSchema, RawData);
        exp_RawData = borsh.deserialize(RawDataSchema, RawDataEncoded);
        meta1 = exp_RawData.accounts[0];
        meta2 = exp_RawData.accounts[1];
        let meta3 = exp_RawData.accounts[2];
        let meta4 = exp_RawData.accounts[3];
        accountMeta1 = {pubkey: new PublicKey(meta1.key), isWritable: meta1.isWritable, isSigner: false};
        accountMeta2 = {pubkey: new PublicKey(meta2.key), isWritable: meta2.isWritable, isSigner: false};
        let accountMeta3 = {pubkey: new PublicKey(meta3.key), isWritable: meta3.isWritable, isSigner: false};
        let accountMeta4 = {pubkey: new PublicKey(meta4.key), isWritable: meta4.isWritable, isSigner: false};
        await programHackathon.methods.receiveMessage2(Buffer.concat([payloadHead, Buffer.from(RawDataEncoded)]), bump, realForeignEmitterChain, realForeignEmitterAddress).accounts({payer:TestKeypair.publicKey, programAccount: new PublicKey(exp_RawData.programId)}).remainingAccounts([accountMeta1, accountMeta2, accountMeta3, accountMeta4]).signers([TestKeypair]).rpc();


        await requestAirdrop2(receiver_keypair.publicKey);
        const receiver_ata = await getAssociatedTokenAddress(
            mint,
            receiver_keypair.publicKey,
            true
        );

        await pg.sendAndConfirm(new anchor.web3.Transaction().add(createAssociatedTokenAccountInstruction(
            receiver_keypair.publicKey,
            receiver_ata,
            receiver_keypair.publicKey,
            mint
        )), [receiver_keypair]);

        await programVerification.methods.claimTokens().accounts({
            receiver:receiver_keypair.publicKey,
            state: statePda,
            tokenVault: token_vault_ata,
            receiverTokenAccount:receiver_ata,
            proofRecord: proofRecordPda,
        })
            .signers([receiver_keypair]).rpc();
        const receiver_ata_balance = await pg.connection.getTokenAccountBalance(receiver_ata);
        console.log(receiver_ata_balance.value.amount);





        // const seeds = []
        // const [escrow, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, programStake.programId);
        // await programStake.methods.initialize().accounts({signer:TestKeypair.publicKey, escrow: escrow}).signers([TestKeypair]).rpc();
        //
        //
        // encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:true}, {writeable:true, is_signer:false}, {writeable:false, is_signer:false}]);
        // const accountMeta3 = {pubkey: escrow, isWritable: true, isSigner: false};
        // const accountMeta4 = {pubkey: SystemProgram.programId, isWritable: false, isSigner: false};
        // const depositSchema ={ struct: {'amount':'u64'}}
        // const encoded = borsh.serialize(depositSchema, {amount:1000000000});
        // paras = sha256("global:deposit").slice(0, 8);
        // encodedParams = Buffer.concat([paras, encoded]);
        // RawData = {
        //     chain_id: realForeignEmitterChain,
        //     caller: new PublicKey(realForeignEmitterAddress).toBuffer(),
        //     programId: programStake.programId.toBuffer(),
        //     acc_count:3,
        //     accounts:[
        //         {
        //             key: realForeignEmitter.toBuffer(),
        //             isWritable:true,
        //             isSigner: true,
        //         },
        //         {
        //             key: escrow.toBuffer(),
        //             isWritable:true,
        //             isSigner: false,
        //         },
        //         {
        //             key: SystemProgram.programId.toBuffer(),
        //             isWritable:false,
        //             isSigner: false,
        //         }
        //     ],
        //     paras:encodedParams,
        //     acc_meta:Buffer.from(encodeMeta),
        // };
        // RawDataEncoded = borsh.serialize(RawDataSchema, RawData);
        // await programHackathon.methods.receiveMessage2(Buffer.concat([payloadHead, Buffer.from(RawDataEncoded)]), bump, realForeignEmitterChain, realForeignEmitterAddress).accounts({payer:TestKeypair.publicKey, programAccount: programStake.programId}).remainingAccounts([accountMeta1, accountMeta3, accountMeta4]).signers([TestKeypair]).rpc();
        // await printAccountBalance(realForeignEmitter);
    });
});
