# Synapse
The Synapse of the Bolarity Network, the foundation of chain abstraction, responsible for the account interaction, message record, and execution

# Quick Start

You need to install hardhat (used to compile and deploy solidity contracts) and anchor (used to compile and deploy solana programs)

## Build&Test&Deploy

for solidity

```
npx hardhat compile
npx hardhat test
npx run ./scripts/deploy.ts
```

for solana

```
anchor build
anchor test
anchor deploy
```

## How to use

The following examples assume that you have experience in solidity and solana program development. Because the examples use a lot of pseudocode, they cannot be used directly and need to be redeveloped based on this experience.



###### The following demonstrates how to control the Ethereum account through the Solana account.

1. Create a Solana account

2. Create the corresponding Ethereum account,you need to use a Solana account to send messages to the Ethereum contract through the Solana program.

   Here is an example showing how to do it(pseudo code).

   ```
   import { ethers} from "hardhat";
   
   const solanaAddress = new PublicKey("your solana account").toBytes();
   const sourceAddress = coder.encode(["bytes32"],[Buffer.from(solanaAddress)]);
   const payload = coder.encode(["bytes32", "bytes"], [sourceAddress, Buffer.from([0])])
   
   // send message,solana program method send_message
       const programID=new PublicKey(solana program address)
       const program = new anchor.Program(idl, programID);
      const message = hexStringToUint8Array(payload)
       const ix3 = program.methods
           .sendMessage(Buffer.from(message))
           .accounts({
             config: realConfig,
             wormholeProgram: CORE_BRIDGE_PID,
             ...wormholeAccounts2,
           })
           .instruction();
       const tx3 = new Transaction().add(await ix3);
       try {
         let commitment: Commitment = 'confirmed';
         await sendAndConfirmTransaction(provider.connection, tx3, [your solana account], {commitment});
       }
       catch (error: any) {
         console.log(error);
       }
   
   ```

   

3.Query the generated account.

```
  const uniProxy_factory = await ethers.getContractFactory("UniProxy");
  const UniProxy = await uniProxy_factory.attach('uniProxy contract address');
  const sourceChain = 1;// solana
  const userAddress = ethers.zeroPadValue(new PublicKey("your solana account").toBytes(), 32);
  const proxyAddress = await UniProxy.proxys(sourceChain, userAddress);
  console.log(proxyAddress);
```

4.Now you can transfer eth to the account generated above so that you can transfer eth to other accounts through it.

The following example is a Solana account controlling Ethereum transfers.

```
 const solanaAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey("your solana account").toBytes())]);
 const other_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('others account')), 32)])
  let payload_part = coder.encode(["bytes32","uint256", "bytes"], [other_address,BigInt(198000000000000000), Buffer.from([0])]) // amount 198000000000000000=0.198 eth
  const payload = coder.encode(["bytes32", "bytes"], [solanaAddress, payload_part])
  
    // now you can call solana program for send message to etherum contract.
    const programID=new PublicKey(solana program address)
    const program = new anchor.Program(idl, programID);
   const message = hexStringToUint8Array(payload)
    const ix3 = program.methods
        .sendMessage(Buffer.from(message))
        .accounts({
          config: realConfig,
          wormholeProgram: CORE_BRIDGE_PID,
          ...wormholeAccounts2,
        })
        .instruction();
    const tx3 = new Transaction().add(await ix3);
    try {
      let commitment: Commitment = 'confirmed';
      await sendAndConfirmTransaction(provider.connection, tx3, [your solana account], {commitment});
    }
    catch (error: any) {
      console.log(error);
    }
```

5.Control this account through Solana to call other contracts on Ethereum.

```
 const solanaAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey("your solana account").toBytes())]);
 const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from([The contract address you want to call]), 32)])
 // contract function store
 let ABI = ["function store(uint256 num)"];
  let iface = new ethers.Interface(ABI);
  let paras = iface.encodeFunctionData("store", [2]);
  let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address,0, paras])
  const payload = coder.encode(["bytes32", "bytes"], [solanaAddress, payload_part])
  
  // now you can call solana program for send message to etherum contract.
    const programID=new PublicKey(solana program address)
    const program = new anchor.Program(idl, programID);
   const message = hexStringToUint8Array(payload)
    const ix3 = program.methods
        .sendMessage(Buffer.from(message))
        .accounts({
          config: realConfig,
          wormholeProgram: CORE_BRIDGE_PID,
          ...wormholeAccounts2,
        })
        .instruction();
    const tx3 = new Transaction().add(await ix3);
    try {
      let commitment: Commitment = 'confirmed';
      await sendAndConfirmTransaction(provider.connection, tx3, [your solana account], {commitment});
    }
    catch (error: any) {
      console.log(error);
    }
```

###### The following demonstrates how to control the Solana account through the  Ethereum account.

1. Create a Ethereum account
2. Create the corresponding Solana account,you need to use a Ethereum account to send messages to the Solana program through the Ethereum contract.

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

3.Query the generated account.

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

4.Now you can transfer sol to the account generated above so that you can transfer sol to other accounts through it.

The following example is a Ethereum account controlling  Solana transfers.

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

5.Control this account through Ethereum to call other contracts on Solana.

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

