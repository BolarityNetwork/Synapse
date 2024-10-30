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



###### Example 1: Upgrade your Solana account into a universal account

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


###### Example 2: Control a Solana Account through an Ethereum Account


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

