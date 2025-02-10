// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import {Keypair, PublicKey, Transaction, sendAndConfirmTransaction, Commitment} from "@solana/web3.js";

const anchor = require("@coral-xyz/anchor");
import * as bs58 from  "bs58";

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);
  const currentDirectory = process.cwd();
  const idl = JSON.parse(
      require("fs").readFileSync(currentDirectory + "/target/idl/relayer_hub.json", "utf8")
  );
  const programID=new PublicKey("39djqgS6KR6SWb3T39bTj8QMX3iuMMLP41PVjk89ieJh")
  const program = new anchor.Program(idl, programID);
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
  const [finalPoolPDA] = await genPDAAccount("final_pool")
  // // ======================initialize=========================
  const authority =  new PublicKey("D66tZQAUQwKq9mFWUCwj6A9XM8or36q696Rim2hsPnW3");
  // const ix = program.methods
  //     .initialize(authority)
  //     .accounts({
  //       config:configPDA,
  //       relayer_info: relayerInfoPDA,
  //       payer:provider.wallet.publicKey
  //     })
  //     .instruction();
  // const tx = new Transaction().add(await ix);
  // try {
  //     let commitment: Commitment = 'confirmed';
  //     await sendAndConfirmTransaction(provider.connection, tx, [provider.wallet.payer], {commitment});
  // }
  // catch (error: any) {
  //     console.log(error);
  // }
  // ======================update config=========================
  const ix = program.methods
      .updateConfig(authority)
      .accounts({
        config:configPDA,
        owner:provider.wallet.publicKey
      })
      .instruction();
  const tx = new Transaction().add(await ix);
  try {
      let commitment: Commitment = 'confirmed';
      await sendAndConfirmTransaction(provider.connection, tx, [provider.wallet.payer], {commitment});
  }
  catch (error: any) {
      console.log(error);
  }
  // // ======================register pool=========================
  //
  //   const ix = program.methods
  //       .registerTxPool()
  //       .accounts({
  //         config:configPDA,
  //         pool: poolPDA,
  //         final_pool: finalPoolPDA,
  //         owner:provider.wallet.publicKey
  //       })
  //       .instruction();
  //   const tx = new Transaction().add(await ix);
  //   try {
  //       let commitment: Commitment = 'confirmed';
  //       await sendAndConfirmTransaction(provider.connection, tx, [provider.wallet.payer], {commitment});
  //   }
  //   catch (error: any) {
  //       console.log(error);
  //   }

  // ======================register relayer=========================
  // const relayer_keypair =  Keypair.generate();
  // console.log(bs58.encode(relayer_keypair.secretKey));
  // console.log(relayer_keypair.publicKey.toBase58());
  // const relayer_keypair = Keypair.fromSecretKey(
  //     bs58.decode(''));
  //
  // const [relayerPDA] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("relayer"), relayer_keypair.publicKey.toBuffer()],
  //     program.programId
  // );
  // const ix = program.methods
  //     .registerRelayer()
  //     .accounts({
  //       config:configPDA,
  //       relayer_info: relayerInfoPDA,
  //       relayer: relayerPDA,
  //       payer:relayer_keypair.publicKey
  //     })
  //     .instruction();
  // const tx = new Transaction().add(await ix);
  // try {
  //   let commitment: Commitment = 'confirmed';
  //   await sendAndConfirmTransaction(provider.connection, tx, [relayer_keypair], {commitment});
  // }
  // catch (error: any) {
  //   console.log(error);
  // }
};
