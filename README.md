# Synapse
The Synapse of the Bolarity Network serves as the foundation of chain abstraction, responsible for account interaction, message recording, and execution.

# Quick Start

To get started, you will need to install both Hardhat (for compiling and deploying Solidity contracts) and Anchor (for compiling and deploying Solana programs). Follow the instructions below to set up your environment and deploy contracts.

## Build&Test&Deploy

**For Solidity:**

```
npx hardhat compile
npx hardhat test
npx run ./scripts/deploy.ts
```

**For Solana:**

```
anchor build
anchor test
anchor deploy
```

## How to use

This section assumes that you have experience in Solidity and Solana program development. The examples below use a significant amount of pseudocode and cannot be directly used without further development based on your expertise.



## Example 1: Upgrade your Solana account into a universal account

**Step 1: Create a Solana Account**
First, create a Solana account that will be used to control the Ethereum account.

**Step 2: Create the Corresponding Ethereum Account**
You need to use a Solana account to send messages to the Ethereum contract through the Solana program.

**Example Code (Pseudocode):**

   ```
import { ethers } from "hardhat";
import { PublicKey } from "@solana/web3.js";
import { coder } from "your-coder-library"; // Example placeholder

const solanaAddress = new PublicKey("your-solana-account").toBytes();
const sourceAddress = coder.encode(["bytes32"], [Buffer.from(solanaAddress)]);
const payload = coder.encode(["bytes32", "bytes"], [sourceAddress, Buffer.from([0])]);

// Send message using the Solana program
const programID = new PublicKey("solana-program-address");
const program = new anchor.Program(idl, programID);
const message = hexStringToUint8Array(payload);

const ix3 = program.methods.sendMessage(Buffer.from(message)).accounts({
  config: realConfig,
  wormholeProgram: CORE_BRIDGE_PID,
  ...wormholeAccounts2,
}).instruction();

const tx3 = new Transaction().add(await ix3);

try {
  const commitment: Commitment = 'confirmed';
  await sendAndConfirmTransaction(provider.connection, tx3, [yourSolanaAccount], { commitment });
} catch (error) {
  console.error(error);
}

   ```

   

**Step 3: Query the Generated Proxy Account**

```
const uniProxyFactory = await ethers.getContractFactory("UniProxy");
const UniProxy = await uniProxyFactory.attach("uniProxy-contract-address");
const sourceChain = 1; // Solana
const userAddress = ethers.zeroPadValue(new PublicKey("your-solana-account").toBytes(), 32);
const proxyAddress = await UniProxy.proxys(sourceChain, userAddress);
console.log(proxyAddress);

```

**Step 4: Transfer ETH to the Generated Account**
Now you can transfer ETH to the generated account to allow it to control Ethereum transfers.

The following example is a Solana account controlling Ethereum transfers.

```
const solanaAddress = coder.encode(["bytes32"], [Buffer.from(new PublicKey("your-solana-account").toBytes())]);
const otherAddress = coder.encode(["bytes32"], [ethers.zeroPadValue(Buffer.from(hexStringToUint8Array("other-account")), 32)]);
let payloadPart = coder.encode(["bytes32", "uint256", "bytes"], [otherAddress, BigInt(198000000000000000), Buffer.from([0])]); // 0.198 ETH
const payload = coder.encode(["bytes32", "bytes"], [solanaAddress, payloadPart]);

// Send message using the Solana program
const programID = new PublicKey("solana-program-address");
const program = new anchor.Program(idl, programID);
const message = hexStringToUint8Array(payload);

const ix3 = program.methods.sendMessage(Buffer.from(message)).accounts({
  config: realConfig,
  wormholeProgram: CORE_BRIDGE_PID,
  ...wormholeAccounts2,
}).instruction();

const tx3 = new Transaction().add(await ix3);

try {
  const commitment: Commitment = 'confirmed';
  await sendAndConfirmTransaction(provider.connection, tx3, [yourSolanaAccount], { commitment });
} catch (error) {
  console.error(error);
}

```

**Step 5: Control this Account to Call Other Contracts on Ethereum**

```
const solanaAddress = coder.encode(["bytes32"], [Buffer.from(new PublicKey("your-solana-account").toBytes())]);
const contractAddress = coder.encode(["bytes32"], [ethers.zeroPadValue(Buffer.from([contractAddressYouWantToCall]), 32)]);
let ABI = ["function store(uint256 num)"];
let iface = new ethers.Interface(ABI);
let params = iface.encodeFunctionData("store", [2]);
let payloadPart = coder.encode(["bytes32", "uint256", "bytes"], [contractAddress, 0, params]);
const payload = coder.encode(["bytes32", "bytes"], [solanaAddress, payloadPart]);

// Send message using the Solana program
const programID = new PublicKey("solana-program-address");
const program = new anchor.Program(idl, programID);
const message = hexStringToUint8Array(payload);

const ix3 = program.methods.sendMessage(Buffer.from(message)).accounts({
  config: realConfig,
  wormholeProgram: CORE_BRIDGE_PID,
  ...wormholeAccounts2,
}).instruction();

const tx3 = new Transaction().add(await ix3);

try {
  const commitment: Commitment = 'confirmed';
  await sendAndConfirmTransaction(provider.connection, tx3, [yourSolanaAccount], { commitment });
} catch (error) {
  console.error(error);
}

```


## Example 2: Control a Solana Account through an Ethereum Account


**Step 1: Create an Ethereum Account**
Start by creating an Ethereum account to control a Solana account.

**Step 2: Create the Corresponding Solana Account**
You will need to use an Ethereum account to send messages to the Solana program through an Ethereum contract.

**Example Code (Pseudocode):**

```
  const borsh = require('borsh');
  
  const AccountMeta = {
    array: {
        type: {struct:{writeable:'bool', is_signer:'bool'}},
    }
  }
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
  const HELLO_WORLD_PID = new PublicKey("solana program address");
  const realForeignEmitterChain = 10002;
  const ethAddress = rightAlignBuffer(Buffer.from(hexStringToUint8Array('your etherum address')));
  // create solana account
  const paras = sha256("active").slice(0, 8);
  const encodedParams = Buffer.concat([paras]);

  const encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:false}]);
  const realForeignEmitter = deriveAddress(
    [
        Buffer.from("pda"),
        (() => {
            const buf = Buffer.alloc(2);
            buf.writeUInt16LE(realForeignEmitterChain); // 10002 Sepolia testnet
            return buf;
        })(),
        ethAddress,
    ],
    HELLO_WORLD_PID
);
  const RawData = {
      chain_id: realForeignEmitterChain,
      caller: ethAddress,
      programId:new PublicKey(HELLO_WORLD_PID).toBuffer(),
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
  const RawDataEncoded = Buffer.from(borsh.serialize(RawDataSchema, RawData));
  const uniProxy_factory = await ethers.getContractFactory("UniProxy");
  const UniProxy = await uniProxy_factory.attach('UniProxy contract address');
  const receipt = await UniProxy.sendMessage(RawDataEncoded);
  console.log(receipt.hash)
```

**Step 3: Query the Generated Account**

```
 function deriveEthAddressKey(
  programId: PublicKeyInitData,
  chain: ChainId,
  address: PublicKey,
) {
  return deriveAddress(
      [
          Buffer.from("pda"),
          (() => {
              const buf = Buffer.alloc(2);
              buf.writeUInt16LE(chain);
              return buf;
          })(),
          address.toBuffer(),
      ],
      programId
  );
}
 
 const addressKey = await deriveEthAddressKey(HELLO_WORLD_PID, realForeignEmitterChain, new PublicKey(ethAddress));
```

**Step 4: Transfer SOL to the Generated Account**
Use the Ethereum account to transfer SOL to the generated account, allowing it to control Solana transfers.

Example Code (Pseudocode):

```

  const paras = sha256("transfer").slice(0, 8);
  const buf = Buffer.alloc(8);
  buf.writeBigUint64LE(BigInt(3000000000),0); // 3000000000=3 sol
  const encodedParams = Buffer.concat([paras, buf]);

  const encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:true},{writeable:true, is_signer:false}]);
  const realForeignEmitter = deriveAddress(
    [
        Buffer.from("pda"),
        (() => {
            const buf = Buffer.alloc(2);
            buf.writeUInt16LE(realForeignEmitterChain);
            return buf;
        })(),
        ethAddress,
    ],
    HELLO_WORLD_PID
);
  const RawData = {
      chain_id: realForeignEmitterChain,
      caller: ethAddress,
      programId:HELLO_WORLD_PID.toBuffer(),
      acc_count:2,
      accounts:[
          {
              key: realForeignEmitter.toBuffer(),
              isWritable:true,
              isSigner: true,
          },
          {
            key: new PublicKey("other solana account").toBuffer(),
            isWritable:true,
            isSigner: false,
        }
      ],
      paras:encodedParams,
      acc_meta:Buffer.from(encodeMeta),
  };
  const RawDataEncoded = Buffer.from(borsh.serialize(RawDataSchema, RawData));
  const uniProxy_factory = await ethers.getContractFactory("UniProxy");
  const UniProxy = await uniProxy_factory.attach('UniProxy contract address');
  const receipt = await UniProxy.sendMessage(RawDataEncoded);
  console.log(receipt.hash)
```

**Step 5: Control this Account to Call Other Contracts on Solana**

```
  const myParametersSchema ={ struct: {'value1':'u8', 'value2':'u8'}}
  class MyParameters {
    value1: number;
    value2: number;
  
    constructor(value1: number, value2: number) {
        this.value1 = value1;
        this.value2 = value2;
    }
  }
  const AccountMeta = {
    array: {
        type: {struct:{writeable:'bool', is_signer:'bool'}},
    }
  }
  
const programTest = "test program address";
  const [myStorage, _bump] = PublicKey.findProgramAddressSync([], new PublicKey(programTest));
  const params = new MyParameters(2, 2);
  const encoded = borsh.serialize(myParametersSchema, params);
  const paras = sha256("global:set").slice(0, 8);
  const encodedParams = Buffer.concat([paras, encoded]);

  const encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:false}]);
  const realForeignEmitter = deriveAddress(
    [
        Buffer.from("pda"),
        (() => {
            const buf = Buffer.alloc(2);
            buf.writeUInt16LE(realForeignEmitterChain);
            return buf;
        })(),
        ethAddress,
    ],
    HELLO_WORLD_PID
);
  const RawData = {
      chain_id: realForeignEmitterChain,
      caller: ethAddress,
      programId:new PublicKey(programTest).toBuffer(),
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
  const RawDataEncoded = Buffer.from(borsh.serialize(RawDataSchema, RawData));
  const uniProxy_factory = await ethers.getContractFactory("UniProxy");
  const UniProxy = await uniProxy_factory.attach('UniProxy contract address');
  const receipt = await UniProxy.sendMessage(RawDataEncoded);
  console.log(receipt.hash)
```

## Example 3: Mix asset transfer

From the examples above, it is evident that Ethereum accounts can be managed through Solana accounts, and vice versa. When it comes to transferring SOL, there are two methods available: 

1. **Using Solana Account**:

   Transfer SOL using the Solana account. Simultaneously, control the Ethereum account via a token bridge to transfer SOL on the Ethereum chain to the target account using a cross-chain approach.    

2. **Using Ethereum Account**: 

   Transfer SOL to the target account through the token bridge cross-chain method from the Ethereum account. Then, utilize the Solana account controlled by the Ethereum account to transfer SOL to the target account.

**Way 1: Operating on the Solana Chain**

If your Solana account holds sufficient SOL, you can transfer it directly.

```

const userKeypair = Keypair.fromSecretKey(
        bs58.decode(secret key));
        
const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: userKeypair.publicKey,
            toPubkey: new PublicKey(other solana address),
            lamports: amount,
        }))
    ;
try {
      let commitment: Commitment = 'confirmed';
      await sendAndConfirmTransaction(provider.connection, tx, [userKeypair], {commitment});
    }
 catch (error: any) {
      console.log(error);
    }
```

If your Solana account lacks adequate SOL but the SOL on the Ethereum chain is sufficient, you can utilize a mixed asset transfer.

```
    // Note that you need to approve wsol before using it.
    const userKeypair = Keypair.fromSecretKey(
            bs58.decode(secret key));
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
        userKeypair.publicKey,
        message2
    );
      const byte32Address = tryNativeToHexString(
      other solana address,
      1 // solana chain id
  );
  const targetRecipient = coder.encode(["bytes32"],[Buffer.from(hexStringToUint8Array(byte32Address))]);
  let ABI = ["function transferTokensWithRelay(\
        address token,\
        uint256 amount,\
        uint256 toNativeTokenAmount,\
        uint16 targetChain,\
        bytes32 targetRecipient,\
        uint32 batchId\
    )"];
  let iface = new ethers.Interface(ABI);
  let paras = iface.encodeFunctionData("transferTokensWithRelay", [WSOL_CONTRACT_ADDRESS,amount1, 0, 1, targetRecipient , 0]);
  
  let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
  const payload = coder.encode(["bytes32", "bytes"], [userAddress, payload_part])
  const ix3 = program.methods
        .sendMessage(Buffer.from(payload))
        .accounts({
          config: realConfig,
          wormholeProgram: CORE_BRIDGE_PID,
          ...wormholeAccounts2,
        })
        .instruction();
  const tx3 = new Transaction().add(await ix3).add(
        SystemProgram.transfer({
            fromPubkey: userKeypair.publicKey,
            toPubkey: new PublicKey(other solana address),
            lamports: amount2,
        }))
    ;
  try {
      let commitment: Commitment = 'confirmed';
      await sendAndConfirmTransaction(provider.connection, tx3, [userKeypair], {commitment});
    }
    catch (error: any) {
      console.log(error);
    }
```

**Way 2: Operating on the Ethereum Chain**

Transfer SOL across chains on the Ethereum chain using a token bridge.

```
  // Note that you need to approve wsol before using it.
  const TOKEN_BRIDGE_RELAYER_ABI = [
  "function transferTokensWithRelay(\
        address token,\
        uint256 amount,\
        uint256 toNativeTokenAmount,\
        uint16 targetChain,\
        bytes32 targetRecipient,\
        uint32 batchId\
    ) public payable returns (uint64 messageSequence)"
  ];

  const tokenBridgeRelayerContract = new ethers.Contract(TOKEN_BRIDGE_RELAYER_CONTRACT, TOKEN_BRIDGE_RELAYER_ABI, signer);
  const transferTokensWithRelayTx = await tokenBridgeRelayerContract.transferTokensWithRelay(
    WSOL_CONTRACT_ADDRESS,
    amount,
    0,
    1,
    targetRecipient,
    0,
  );
  console.log(transferTokensWithRelayTx.hash)
```

Control the Solana account to transfer SOL on the Ethereum chain. Please refer to Example 2.
