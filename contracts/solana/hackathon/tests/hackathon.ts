import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Hackathon } from "../target/types/hackathon";
import { Proxy } from "../target/types/proxy";
import { Test } from "../target/types/test";
import {Commitment, Keypair, PublicKey, sendAndConfirmTransaction, Transaction} from "@solana/web3.js";
const borsh = require('borsh');
import { createHash } from 'crypto';
import {
    createMint,
    createAssociatedTokenAccount,
    mintTo,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID, getMint
} from "@solana/spl-token";
import * as buffer from "buffer";
import * as bs58 from  "bs58";

describe("hackathon", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const programProxy = anchor.workspace.Proxy as Program<Proxy>;
  const programTest = anchor.workspace.Test as Program<Test>;

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
    // const schema2 ={ struct: {'value1':'u64'}}
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
});
