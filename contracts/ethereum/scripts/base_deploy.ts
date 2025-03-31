import { ethers} from "hardhat";
import fs from 'fs';
import {
    PublicKey,
    PublicKeyInitData,
    Connection,
} from "@solana/web3.js";
import { createHash } from 'crypto';
const borsh = require('borsh');


function deriveAddress(
    seeds: (Buffer | Uint8Array)[],
    programId: PublicKeyInitData
): PublicKey {
    return PublicKey.findProgramAddressSync(seeds, new PublicKey(programId))[0];
}

function deriveWormholeEmitterKey(
    emitterProgramId: PublicKeyInitData
): PublicKey {
    return deriveAddress([Buffer.from("emitter")], emitterProgramId);
}

function sha256(input: string): Buffer {
    const hash = createHash('sha256');
    hash.update(input);
    return hash.digest();
}
function rightAlignBuffer(data: Buffer): Buffer {
    const buffer = Buffer.alloc(32);
    const dataLength = data.length;
    if (dataLength > 32) {
        throw new Error("Data exceeds 32 bytes");
    }
    data.copy(buffer, 32 - dataLength, 0, dataLength);
    return buffer;
}

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
async function main() {
    const RELAYER_SOLANA_CONTRACT = "5tFEXwUwpAzMXBWUSjQNWVfEh7gKbTc5hQMqBwi8jQ7k";
    const RELAYER_BASE_SEPOLIA_CONTRACT = "0x232A9b207A1B91d527C300d5fD47778F60596Eb8";
    const SOLANA_CHAIN_ID = 1; //wormhole solana chain id
    const BASE_SEPOLIA_CHAIN_ID = 10004; //wormhole sepolia chain id
    const USER_SOLANA_ADDRESS = "6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF";
    const USER_SEPOLIA_ADDRESS = "0x842aDB7084103E3Ff258dA808A1107f4358ec5c1";
    // deploy UniProxy contract
    // const UniProxy = await ethers.deployContract("UniProxy", ["0x79A1027a6A159502049F10906D333EC57E95F083", 200]);
    //
    // await UniProxy.waitForDeployment();
    //
    // console.log(
    //   `deployed to ${UniProxy.target}`
    // );

    // const targetContractAddressHex = "0x" + deriveWormholeEmitterKey(RELAYER_SOLANA_CONTRACT)
    //     .toBuffer()
    //     .toString("hex")
    //     console.log(targetContractAddressHex)
    // const receipt = await UniProxy.setRegisteredSender(SOLANA_CHAIN_ID, targetContractAddressHex);
    // console.log(receipt.hash)

    // already deploy contract
    // const uniProxy_factory = await ethers.getContractFactory("UniProxy");
    // const UniProxy = await uniProxy_factory.attach(RELAYER_BASE_SEPOLIA_CONTRACT);
    // const receipt = await UniProxy.setRegisteredSender(SOLANA_CHAIN_ID, targetContractAddressHex);
    // console.log(receipt.hash)


    // 0xFE | version (u8) | type (Parser Type, u8)|reserve (u8) | from chain(u16)| to chain(u16)| reserve(24 byte) | data (vec<u8>)
    const solanaChainIdBuffer = Buffer.alloc(2);
    solanaChainIdBuffer.writeUInt16BE(SOLANA_CHAIN_ID);
    const baseSepoliaChainIdBuffer = Buffer.alloc(2);
    baseSepoliaChainIdBuffer.writeUInt16BE(BASE_SEPOLIA_CHAIN_ID);

    const reserved = 0;
   // solana ---> base sepolia
    const solanaBasePayloadHead = Buffer.concat([Buffer.from([0xFE, 0x01, 0x00, 0x00]),  solanaChainIdBuffer, baseSepoliaChainIdBuffer, Buffer.alloc(reserved)]);
    // base sepolia ---> solana
    const baseSepoliaPayloadHead = Buffer.concat([Buffer.from([0xFE, 0x01, 0x00, 0x00]),  baseSepoliaChainIdBuffer, solanaChainIdBuffer, Buffer.alloc(reserved)]);

    // // =============Solana Account Operation Ethereum Contract=========================================
    // const coder = ethers.AbiCoder.defaultAbiCoder();
    // // Query the evm address corresponding to the solana account.
    // const uniProxy_factory = await ethers.getContractFactory("UniProxy");
    // const UniProxy = await uniProxy_factory.attach(RELAYER_BASE_SEPOLIA_CONTRACT);
    // const sourceChain = SOLANA_CHAIN_ID;// solana
    // const userSolanaAddress = ethers.zeroPadValue(new PublicKey(USER_SOLANA_ADDRESS).toBytes(), 32);
    // const proxyAddress = await UniProxy.proxys(sourceChain, userSolanaAddress);
    // console.log(proxyAddress);

    // // To activate the address, you need to operate on the Solana side and assemble the data
    // const contractAddress = new PublicKey(USER_SOLANA_ADDRESS).toBytes();
    // const sourceAddress = coder.encode(["bytes32"],[Buffer.from(contractAddress)]);
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaBasePayloadHead, sourceAddress, Buffer.from([0])])
    // console.log(payload)

    // // Transfer eth to an address
    // const sourceContract = coder.encode(["bytes32"],[Buffer.from(new PublicKey(USER_SOLANA_ADDRESS).toBytes())]);
    // const other_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x049B426457B5A75e0e25F0b692dF581a06035647')), 32)]) // dst address
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [other_address,BigInt(10000000000000000), Buffer.from([0])]) // 0.001
    // const txPayload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaBasePayloadHead, sourceContract, payload_part])
    // console.log(txPayload)


    // Get the balance of USDT
    // const USDT_CONTRACT_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";// USDC base sepolia
    // const USDT_ABI = [
    //     "function balanceOf(address owner) view returns (uint256)",
    //     "function transfer(address to, uint256 value) returns (bool)",
    //     "function allowance(address owner, address spender) external view returns (uint256)",
    // ];
    // const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, ethers.provider);
    // // Get Balance
    // const balance = await usdtContract.balanceOf(proxyAddress);//Your solana proxy address
    // console.log(balance)

    // // Transfer usdt
    // const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey(USER_SOLANA_ADDRESS).toBytes())]);
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(USDT_CONTRACT_ADDRESS)), 32)])//usdt contract address
    // let ABI = ["function transfer(address to, uint256 value) returns (bool)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("transfer", ['0xa550C6011DfBA4925abEb0B48104062682870BB8', BigInt('1000000')]);//1usdt, usdt 6-digit precision
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0 , paras])
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaBasePayloadHead, userAddress, payload_part])
    // console.log(payload)

    //   // Query the USDT of Deposit
    //   const AAVE_UNI_POOL_CONTRACT = "0x884702e4b1d0a2900369e83d5765d537f469cac9"; // UiPoolDataProvider
    //   const AAVE_POOL_ADDRESSES_CONTRACT = "0xd449fed49d9c443688d6816fe6872f21402e41de"; // PoolAddressesProvider
    //   const AAVE_ABI = [{"inputs":[{"internalType":"contract IPoolAddressesProvider","name":"provider","type":"address"},{"internalType":"address","name":"user","type":"address"}],"name":"getUserReservesData","outputs":[{"components":[{"internalType":"address","name":"underlyingAsset","type":"address"},{"internalType":"uint256","name":"scaledATokenBalance","type":"uint256"},{"internalType":"bool","name":"usageAsCollateralEnabledOnUser","type":"bool"},{"internalType":"uint256","name":"stableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"scaledVariableDebt","type":"uint256"},{"internalType":"uint256","name":"principalStableDebt","type":"uint256"},{"internalType":"uint256","name":"stableBorrowLastUpdateTimestamp","type":"uint256"}],"internalType":"struct IUiPoolDataProviderV3.UserReserveData[]","name":"","type":"tuple[]"},{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
    // {"inputs":[{"internalType":"contract IPoolAddressesProvider","name":"provider","type":"address"}],"name":"getReservesData","outputs":[{"components":[{"internalType":"address","name":"underlyingAsset","type":"address"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint256","name":"decimals","type":"uint256"},{"internalType":"uint256","name":"baseLTVasCollateral","type":"uint256"},{"internalType":"uint256","name":"reserveLiquidationThreshold","type":"uint256"},{"internalType":"uint256","name":"reserveLiquidationBonus","type":"uint256"},{"internalType":"uint256","name":"reserveFactor","type":"uint256"},{"internalType":"bool","name":"usageAsCollateralEnabled","type":"bool"},{"internalType":"bool","name":"borrowingEnabled","type":"bool"},{"internalType":"bool","name":"stableBorrowRateEnabled","type":"bool"},{"internalType":"bool","name":"isActive","type":"bool"},{"internalType":"bool","name":"isFrozen","type":"bool"},{"internalType":"uint128","name":"liquidityIndex","type":"uint128"},{"internalType":"uint128","name":"variableBorrowIndex","type":"uint128"},{"internalType":"uint128","name":"liquidityRate","type":"uint128"},{"internalType":"uint128","name":"variableBorrowRate","type":"uint128"},{"internalType":"uint128","name":"stableBorrowRate","type":"uint128"},{"internalType":"uint40","name":"lastUpdateTimestamp","type":"uint40"},{"internalType":"address","name":"aTokenAddress","type":"address"},{"internalType":"address","name":"stableDebtTokenAddress","type":"address"},{"internalType":"address","name":"variableDebtTokenAddress","type":"address"},{"internalType":"address","name":"interestRateStrategyAddress","type":"address"},{"internalType":"uint256","name":"availableLiquidity","type":"uint256"},{"internalType":"uint256","name":"totalPrincipalStableDebt","type":"uint256"},{"internalType":"uint256","name":"averageStableRate","type":"uint256"},{"internalType":"uint256","name":"stableDebtLastUpdateTimestamp","type":"uint256"},{"internalType":"uint256","name":"totalScaledVariableDebt","type":"uint256"},{"internalType":"uint256","name":"priceInMarketReferenceCurrency","type":"uint256"},{"internalType":"address","name":"priceOracle","type":"address"},{"internalType":"uint256","name":"variableRateSlope1","type":"uint256"},{"internalType":"uint256","name":"variableRateSlope2","type":"uint256"},{"internalType":"uint256","name":"stableRateSlope1","type":"uint256"},{"internalType":"uint256","name":"stableRateSlope2","type":"uint256"},{"internalType":"uint256","name":"baseStableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"baseVariableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"optimalUsageRatio","type":"uint256"},{"internalType":"bool","name":"isPaused","type":"bool"},{"internalType":"bool","name":"isSiloedBorrowing","type":"bool"},{"internalType":"uint128","name":"accruedToTreasury","type":"uint128"},{"internalType":"uint128","name":"unbacked","type":"uint128"},{"internalType":"uint128","name":"isolationModeTotalDebt","type":"uint128"},{"internalType":"bool","name":"flashLoanEnabled","type":"bool"},{"internalType":"uint256","name":"debtCeiling","type":"uint256"},{"internalType":"uint256","name":"debtCeilingDecimals","type":"uint256"},{"internalType":"uint8","name":"eModeCategoryId","type":"uint8"},{"internalType":"uint256","name":"borrowCap","type":"uint256"},{"internalType":"uint256","name":"supplyCap","type":"uint256"},{"internalType":"uint16","name":"eModeLtv","type":"uint16"},{"internalType":"uint16","name":"eModeLiquidationThreshold","type":"uint16"},{"internalType":"uint16","name":"eModeLiquidationBonus","type":"uint16"},{"internalType":"address","name":"eModePriceSource","type":"address"},{"internalType":"string","name":"eModeLabel","type":"string"},{"internalType":"bool","name":"borrowableInIsolation","type":"bool"}],"internalType":"struct IUiPoolDataProviderV3.AggregatedReserveData[]","name":"","type":"tuple[]"},{"components":[{"internalType":"uint256","name":"marketReferenceCurrencyUnit","type":"uint256"},{"internalType":"int256","name":"marketReferenceCurrencyPriceInUsd","type":"int256"},{"internalType":"int256","name":"networkBaseTokenPriceInUsd","type":"int256"},{"internalType":"uint8","name":"networkBaseTokenPriceDecimals","type":"uint8"}],"internalType":"struct IUiPoolDataProviderV3.BaseCurrencyInfo","name":"","type":"tuple"}],"stateMutability":"view","type":"function"}];
    //   const aavetContract = new ethers.Contract(AAVE_UNI_POOL_CONTRACT, AAVE_ABI, ethers.provider);
    //   try {
    //     const reserves = await aavetContract.getUserReservesData(AAVE_POOL_ADDRESSES_CONTRACT, proxyAddress);//Your own address
    //     let scaledATokenBalance;
    //     let liquidityIndex ;
    //     let liquidityRate;
    //     for (const item of reserves[0]) {
    //       if (item[0]==USDT_CONTRACT_ADDRESS) {
    //         console.log(item);
    //         scaledATokenBalance = item[1];
    //       }
    //     }
    //     const reservesData = await aavetContract.getReservesData(AAVE_POOL_ADDRESSES_CONTRACT);
    //     for (const item of reservesData[0]) {
    //       if (item[0]==USDT_CONTRACT_ADDRESS) {
    //         console.log(item);
    //         liquidityIndex= item[13]
    //         liquidityRate = item[15]
    //       }
    //     }
    //     const tenToThe27: BigInt = BigInt(10 ** 27);
    //     const balance: BigInt = (scaledATokenBalance * liquidityIndex) / tenToThe27;
    //     console.log(balance)//usdt 6-digit precision, self-modify display
    //
    //     const RAY = BigInt(10**27) // 10 to the power 27
    //     const SECONDS_PER_YEAR = 31536000;
    //     console.log(liquidityRate);
    //     const depositAPR = liquidityRate/RAY
    //     console.log(depositAPR);
    //     // const depositAPY = ((1 + (depositAPR / SECONDS_PER_YEAR)) ^ SECONDS_PER_YEAR) - 1
    //     const depositAPRNumber = Number(depositAPR) / Number(SECONDS_PER_YEAR);
    //     const depositAPY = (Math.pow(1 + depositAPRNumber, Number(SECONDS_PER_YEAR)) - 1);
    //     console.log(depositAPY)
    //   } catch (error) {
    //       console.error('Error fetching reserves data:', error);
    //   }


    // ================================Calling aave’s contract========================================
    // const AAVE_POOL_CONTRACT = "0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b";
    // const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey(USER_SOLANA_ADDRESS).toBytes())]);//Your own Solana address
    //   // Approve USDT
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(USDT_CONTRACT_ADDRESS)), 32)])
    // let ABI = ["function approve(address to, uint256 tokenId)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("approve", [AAVE_POOL_CONTRACT, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes8","bytes32", "bytes"], [solanaBasePayloadHead, userAddress, payload_part])
    // console.log(payload)

    // // Deposit USDT, you need to approve USDT before use
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(AAVE_POOL_CONTRACT)), 32)])
    // let ABI = ["function supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("supply", [USDT_CONTRACT_ADDRESS, 1000000, proxyAddress, 0]);//1usdt, usdt 6-digit precision
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes8","bytes32", "bytes"], [solanaBasePayloadHead, userAddress, payload_part])
    // console.log(payload)

    // // withdraw USDT
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(AAVE_POOL_CONTRACT)), 32)])
    // let ABI = ["function withdraw(address asset,uint256 amount,address to)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("withdraw", [USDT_CONTRACT_ADDRESS, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), proxyAddress]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes8","bytes32", "bytes"], [solanaBasePayloadHead, userAddress, payload_part])
    // console.log(payload)

    // const AAVE_WRAPPED_TOKEN_GATEWAY_CONTRACT = "0xF6Dac650dA5616Bc3206e969D7868e7c25805171"; //WrappedTokenGateway
    // // Deposit ETH
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(AAVE_WRAPPED_TOKEN_GATEWAY_CONTRACT)), 32)])
    // let ABI = ["function depositETH(address ,address onBehalfOf,uint16 referralCode)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("depositETH", [AAVE_POOL_CONTRACT, proxyAddress, 0]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address,BigInt(10000000000000000), paras]) //deposit 0.01eth
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaBasePayloadHead, userAddress, payload_part])
    // console.log(payload)

    // // approve
    // const AAVE_ETH_WETH = '0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830';// aEthWETH
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(AAVE_ETH_WETH)), 32)])
    // let ABI = ["function approve(address spender,uint256 amount)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("approve", [AAVE_WRAPPED_TOKEN_GATEWAY_CONTRACT, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaBasePayloadHead, userAddress, payload_part])
    // console.log(payload)

    // // withdrawETH
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(AAVE_WRAPPED_TOKEN_GATEWAY_CONTRACT)), 32)])
    // let ABI = ["function withdrawETH(address ,uint256 amount,address to)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("withdrawETH", [AAVE_POOL_CONTRACT, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), proxyAddress]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaBasePayloadHead, userAddress, payload_part])
    // console.log(payload)


    //=================================Ethereum Account Control Solana Contract============================================================
    // // Get the address and calculate the Solana address corresponding to ETH
    // const HELLO_WORLD_PID = new PublicKey(RELAYER_SOLANA_CONTRACT);
    // const realForeignEmitterChain = BASE_SEPOLIA_CHAIN_ID;
    // const ethAddress = rightAlignBuffer(Buffer.from(hexStringToUint8Array(USER_SEPOLIA_ADDRESS)));
    // const addressKey = await deriveEthAddressKey(HELLO_WORLD_PID, realForeignEmitterChain, new PublicKey(ethAddress));
    // console.log(addressKey.toBase58())

//     //Activation Address
//     const paras = sha256("active").slice(0, 8);
//     const encodedParams = Buffer.concat([paras]);
//
//     let accountMetaList = [
//         {writeable:true, is_signer:false},
//     ]
//   const encodeMeta = borsh.serialize(AccountMeta, accountMetaList);
//   const realForeignEmitter = deriveAddress(
//     [
//         Buffer.from("pda"),
//         (() => {
//             const buf = Buffer.alloc(2);
//             buf.writeUInt16LE(realForeignEmitterChain);
//             return buf;
//         })(),
//         ethAddress,
//     ],
//     HELLO_WORLD_PID
// );
//   const RawData = {
//       chain_id: realForeignEmitterChain,
//       caller: ethAddress,
//       programId:new PublicKey(HELLO_WORLD_PID).toBuffer(),
//       acc_count:1,
//       accounts:[
//           {
//               key: realForeignEmitter.toBuffer(),
//               isWritable:true,
//               isSigner: false,
//           }
//       ],
//       paras:encodedParams,
//       acc_meta:Buffer.from(encodeMeta),
//   };
//   const RawDataEncoded = Buffer.from(borsh.serialize(RawDataSchema, RawData));
//   const uniProxy_factory = await ethers.getContractFactory("UniProxy");
//   const UniProxy = await uniProxy_factory.attach(RELAYER_BASE_SEPOLIA_CONTRACT);
//   const receipt = await UniProxy.sendMessage(Buffer.concat([baseSepoliaPayloadHead, RawDataEncoded]));
//   console.log(receipt.hash)

    // //transfer
    // const paras = sha256("transfer").slice(0, 8);
    // const buf = Buffer.alloc(8);
    // buf.writeBigUint64LE(BigInt(10000000),0);
    // const encodedParams = Buffer.concat([paras, buf]);
    // console.log(encodedParams)
    // let accountMetaList = [
    //     {writeable:true, is_signer:true},
    //     {writeable:true, is_signer:false}];
    // const encodeMeta = borsh.serialize(AccountMeta, accountMetaList);
    // const realForeignEmitter = deriveAddress(
    //     [
    //         Buffer.from("pda"),
    //         (() => {
    //             const buf = Buffer.alloc(2);
    //             buf.writeUInt16LE(realForeignEmitterChain);
    //             return buf;
    //         })(),
    //         ethAddress,
    //     ],
    //     HELLO_WORLD_PID
    // );
    // const RawData = {
    //     chain_id: realForeignEmitterChain,
    //     caller: ethAddress,
    //     programId:HELLO_WORLD_PID.toBuffer(),
    //     acc_count:2,
    //     accounts:[
    //         {
    //             key: realForeignEmitter.toBuffer(),
    //             isWritable:accountMetaList[0].writeable,
    //             isSigner: accountMetaList[0].is_signer,
    //         },
    //         {
    //             key: new PublicKey("HD4ktk6LUewd5vMePdQF6ZtvKi3mC41AD3ZM3qJW8N8e").toBuffer(),
    //             isWritable:accountMetaList[1].writeable,
    //             isSigner: accountMetaList[1].is_signer,
    //         }
    //     ],
    //     paras:encodedParams,
    //     acc_meta:Buffer.from(encodeMeta),
    // };
    // const RawDataEncoded = Buffer.from(borsh.serialize(RawDataSchema, RawData));
    // const uniProxy_factory = await ethers.getContractFactory("UniProxy");
    // const UniProxy = await uniProxy_factory.attach(RELAYER_BASE_SEPOLIA_CONTRACT);
    // const receipt = await UniProxy.sendMessage(Buffer.concat([baseSepoliaPayloadHead, RawDataEncoded]));
    // console.log(receipt.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});