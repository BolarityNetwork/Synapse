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
    const RELAYER_SEPOLIA_CONTRACT = "0x232A9b207A1B91d527C300d5fD47778F60596Eb8";
    const SOLANA_CHAIN_ID = 1; //wormhole solana chain id
    const SEPOLIA_CHAIN_ID = 10002; //wormhole sepolia chain id
    const USER_SOLANA_ADDRESS = "6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF";
    const USER_SEPOLIA_ADDRESS = "0x842aDB7084103E3Ff258dA808A1107f4358ec5c1";
    const NFT_CONTRACT = "0x84D47d9942878B6b40519B665Ca167828DC3b975";
    const Bolarity_NFT_CONTRACT = "0x9198A303ac94DDf8a74aF0352147A8C1097cba5a";
    const Wormhole_NFT_CONTRACT = "0x8a952A532B52bf611a7E3D574B09E37798CEe107";
    const Encode_NFT_CONTRACT = "0xd0Bf8b619Db691327d51F9B28Ed9d33720338F6F";
    const BuFi_NFT_CONTRACT = "0xAc93fD7981E0361B08536aeab979204f1356763F";
    const ZK_Loco_NFT_CONTRACT = "0x624D0d0343d1dD088c6aD9fcDdAb4ac2de6c033d";
    const Polyquest_NFT_CONTRACT = "0xAd3dC1E9ea788875F627463489C71A05E9D1095F";
    const Sherry_NFT_CONTRACT = "0x0753e3291FE2d6876f2Bb26E342D31445AEBEC78";
    const NFT_PROOF_CONTRACT = "0x7d3C4F0F2C0967e6a121e57BEd4E296623770620";
    const NFT_VERIFICATION_CONTRACT = "6QBQwCw7gYQGb4aTW5Hxexcms24AnJRyU9pBCKhDLNSq";
    // // deploy UniProxy contract
    // const UniProxy = await ethers.deployContract("UniProxy", ["0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78", 200]);
    //
    // await UniProxy.waitForDeployment();
    //
    // console.log(
    //   `deployed to ${UniProxy.target}`
    // );
    //
    // const targetContractAddressHex = "0x" + deriveWormholeEmitterKey(RELAYER_SOLANA_CONTRACT)
    //     .toBuffer()
    //     .toString("hex")
    //     console.log(targetContractAddressHex)
    // const receipt = await UniProxy.setRegisteredSender(SOLANA_CHAIN_ID, targetContractAddressHex);
    // console.log(receipt.hash)

    // already deploy contract
    // const uniProxy_factory = await ethers.getContractFactory("UniProxy");
    // const UniProxy = await uniProxy_factory.attach(RELAYER_EVM_CONTRACT);
    // const receipt = await UniProxy.setRegisteredSender(SOLANA_CHAIN_ID, targetContractAddressHex);
    // console.log(receipt.hash)

    //deploy nft contract
    // const NFT = await ethers.deployContract("NFT", ["Sherry", "Sherry", 0, 5000]);
    //
    // await NFT.waitForDeployment();
    //
    // console.log(
    //   `deployed to ${NFT.target}`
    // );
    // const NFT_factory = await ethers.getContractFactory("NFT");
    // const NFT = await NFT_factory.attach(NFT_CONTRACT);
    // let owner = await NFT.ownerOf(2);
    // console.log(owner);

    // // deploy NFTProofRelay contract
    // const NFTProofRelay = await ethers.deployContract("NFTProofRelay", [RELAYER_SEPOLIA_CONTRACT, RELAYER_SEPOLIA_CONTRACT, 0]);
    //
    // await NFTProofRelay.waitForDeployment();
    //
    // console.log(
    //   `deployed to ${NFTProofRelay.target}`
    // );
    // const NFTProofRelay_factory = await ethers.getContractFactory("NFTProofRelay");
    // const NFTProofRelay = await NFTProofRelay_factory.attach(NFT_PROOF_CONTRACT);
    // const receipt = await NFTProofRelay.setApprovedNFTContract(NFT_CONTRACT, true);
    // console.log(receipt.hash)
    // 0xFE | version (u8) | type (Parser Type, u8)|reserve (u8) | from chain(u16)| to chain(u16)| reserve(24 byte) | data (vec<u8>)
    const solanaChainIdBuffer = Buffer.alloc(2);
    solanaChainIdBuffer.writeUInt16BE(SOLANA_CHAIN_ID);
    const sepoliaChainIdBuffer = Buffer.alloc(2);
    sepoliaChainIdBuffer.writeUInt16BE(SEPOLIA_CHAIN_ID);
    const reserved = 0;
    // solana ---> sepolia
    const solanaPayloadHead = Buffer.concat([Buffer.from([0xFE, 0x01, 0x00, 0x00]),  solanaChainIdBuffer, sepoliaChainIdBuffer, Buffer.alloc(reserved)]);
    // sepolia ---> solana
    const sepoliaPayloadHead = Buffer.concat([Buffer.from([0xFE, 0x01, 0x00, 0x00]),  sepoliaChainIdBuffer, solanaChainIdBuffer, Buffer.alloc(reserved)]);

    // // =============Solana Account Operation Ethereum Contract=========================================
    // const coder = ethers.AbiCoder.defaultAbiCoder();
    // // Query the evm address corresponding to the solana account.
    // const uniProxy_factory = await ethers.getContractFactory("UniProxy");
    // const UniProxy = await uniProxy_factory.attach(RELAYER_SEPOLIA_CONTRACT);
    // const sourceChain = SOLANA_CHAIN_ID;// solana
    // const userSolanaAddress = ethers.zeroPadValue(new PublicKey(USER_SOLANA_ADDRESS).toBytes(), 32);
    // const proxyAddress = await UniProxy.proxys(sourceChain, userSolanaAddress);
    // console.log(proxyAddress);
    // // ===============================NFT======================================================
    // // ===============================Mint NFT======================================================
    // const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey(USER_SOLANA_ADDRESS).toBytes())]);
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(NFT_CONTRACT)), 32)])//NFT contract address
    // let ABI = ["function mint() external payable"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("mint");
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0 , paras])
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaPayloadHead, userAddress, payload_part])
    // console.log(payload)
    // ===============================transfer NFT======================================================
    // const tokenID = 2;// tokenid,need modify
    // let ABI = ["function transferFrom(address from, address to, uint256 tokenId)"];
    // let iface = new ethers.Interface(ABI);
    // let toAddress = "0xa550C6011DfBA4925abEb0B48104062682870BB8";// to address,need modify
    // let paras = iface.encodeFunctionData("transferFrom",[proxyAddress, toAddress, tokenID]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0 , paras])
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaPayloadHead, userAddress, payload_part])
    // console.log(payload)
    // ===============================sendProof======================================================
    // const tokenID = 1;// tokenid,need modify
    //
    // const accountMetaList = [
    //     {writeable:true, is_signer:true},
    //     {writeable:true, is_signer:false},
    //     ];
    // let encodeMeta = borsh.serialize(AccountMeta, accountMetaList);
    // const functionSig = sha256("global:process_wormhole_message").slice(0, 8);
    // const payloadSchema = {
    //     struct: {
    //         payload: {array: {type: 'u8'}},
    //     }
    // }
    // let idBuf = Buffer.alloc(8);
    // idBuf.writeBigUint64BE(BigInt(tokenID));
    // // 20+20+8+32
    // const payloadBuf = Buffer.concat([
    //     Buffer.from(hexStringToUint8Array(proxyAddress)),
    //     Buffer.from(hexStringToUint8Array(NFT_CONTRACT)),
    //     idBuf,
    //     Buffer.alloc(32),
    // ]);
    // const [proofRecordPda] = PublicKey.findProgramAddressSync(
    //     [Buffer.from("proof"), payloadBuf.slice(20,40), payloadBuf.slice(40,48)],
    //     new PublicKey(NFT_VERIFICATION_CONTRACT));
    //
    // const paraEncode = borsh.serialize(payloadSchema, {payload:payloadBuf});
    // let encodedParams = Buffer.concat([functionSig, paraEncode]);
    // const ethAddress = rightAlignBuffer(Buffer.from(hexStringToUint8Array(proxyAddress)));
    // const realForeignEmitter = deriveAddress(
    // [
    //     Buffer.from("pda"),
    //     (() => {
    //         const buf = Buffer.alloc(2);
    //         buf.writeUInt16LE(SEPOLIA_CHAIN_ID);
    //         return buf;
    //     })(),
    //     ethAddress,
    // ],
    // new PublicKey(RELAYER_SOLANA_CONTRACT)
    // );
    // let RawData = {
    //     chain_id: SEPOLIA_CHAIN_ID,
    //     caller: new PublicKey(ethAddress).toBuffer(),
    //     programId: new PublicKey(NFT_VERIFICATION_CONTRACT).toBuffer(),
    //     acc_count:2,
    //     accounts:[
    //         {
    //             key: realForeignEmitter.toBuffer(),
    //             isWritable:accountMetaList[0].writeable,
    //             isSigner: accountMetaList[0].is_signer,
    //         },
    //         {
    //             key: proofRecordPda.toBuffer(),
    //             isWritable:accountMetaList[1].writeable,
    //             isSigner: accountMetaList[1].is_signer,
    //         },
    //     ],
    //     paras:encodedParams,
    //     acc_meta:Buffer.from(encodeMeta),
    // };
    // let RawDataEncoded = borsh.serialize(RawDataSchema, RawData);
    // let payloadSend = coder.encode(["bytes"],[Buffer.concat([sepoliaPayloadHead, Buffer.from(RawDataEncoded)])]);
    // const chainIdBuf = Buffer.alloc(4);
    // chainIdBuf.writeUint32BE(SOLANA_CHAIN_ID);
    // const nftContractToken = coder.encode(["bytes32"],[Buffer.concat([chainIdBuf, idBuf, Buffer.from(hexStringToUint8Array(NFT_CONTRACT))])])
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(NFT_PROOF_CONTRACT)), 32)])//NFT contract address
    // let ABI = ["function sendProof(bytes32 nftContractToken, bytes calldata payload)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("sendProof",[nftContractToken, payloadSend]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0 , paras])
    // const payload = coder.encode([ "bytes8", "bytes32", "bytes"], [ solanaPayloadHead, userAddress, payload_part])
    // console.log(payload)

    // // To activate the address, you need to operate on the Solana side and assemble the data
    // const contractAddress = new PublicKey(USER_SOLANA_ADDRESS).toBytes();
    // const sourceAddress = coder.encode(["bytes32"],[Buffer.from(contractAddress)]);
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaPayloadHead, sourceAddress, Buffer.from([0])])
    // console.log(payload)

    // // Transfer eth to an address
    // const sourceContract = coder.encode(["bytes32"],[Buffer.from(new PublicKey(USER_SOLANA_ADDRESS).toBytes())]);
    // const other_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x190a350e055F8713f18EDF2D0Bd3D79a548e0222')), 32)]) // dst address
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [other_address,BigInt(123457000000000), Buffer.alloc(0)]) // 0.001
    // const txPayload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaPayloadHead, sourceContract, payload_part])
    // console.log(txPayload)


    // // Get the balance of USDT
    // const USDT_CONTRACT_ADDRESS = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
    // const USDT_ABI = [
    //     "function balanceOf(address owner) view returns (uint256)",
    //     "function transfer(address to, uint256 value) returns (bool)",
    //     "function allowance(address owner, address spender) external view returns (uint256)",
    // ];
    // const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, ethers.provider);
    // // Get Balance
    // const balance = await usdtContract.balanceOf(proxyAddress);//Your solana proxy address
    // console.log(balance)
    // const balance = await usdtContract.balanceOf(proxyAddress);//Your solana proxy address
    // console.log(balance)
    // const balance = await usdtContract.allowance('0x1efA529215856ae06d6f9e8c78B253FF8cAE7122', '0x6ae43d3271ff6888e7fc43fd7321a503ff738951');//Your solana proxy address
    // console.log(balance)

    // // Transfer usdt
    // const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey(USER_SOLANA_ADDRESS).toBytes())]);
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(USDT_CONTRACT_ADDRESS)), 32)])//usdt contract address
    // let ABI = ["function transfer(address to, uint256 value) returns (bool)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("transfer", ['0xa550C6011DfBA4925abEb0B48104062682870BB8', BigInt('1000000')]);//1usdt, usdt 6-digit precision
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0 , paras])
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaPayloadHead, userAddress, payload_part])
    // console.log(payload)

    //   // Query the USDT of Deposit
    //   const AAVE_CONTRACT_ADDRESS = "0x69529987fa4a075d0c00b0128fa848dc9ebbe9ce";
    //   const AAVE_ABI = [{"inputs":[{"internalType":"contract IPoolAddressesProvider","name":"provider","type":"address"},{"internalType":"address","name":"user","type":"address"}],"name":"getUserReservesData","outputs":[{"components":[{"internalType":"address","name":"underlyingAsset","type":"address"},{"internalType":"uint256","name":"scaledATokenBalance","type":"uint256"},{"internalType":"bool","name":"usageAsCollateralEnabledOnUser","type":"bool"},{"internalType":"uint256","name":"stableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"scaledVariableDebt","type":"uint256"},{"internalType":"uint256","name":"principalStableDebt","type":"uint256"},{"internalType":"uint256","name":"stableBorrowLastUpdateTimestamp","type":"uint256"}],"internalType":"struct IUiPoolDataProviderV3.UserReserveData[]","name":"","type":"tuple[]"},{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
    // {"inputs":[{"internalType":"contract IPoolAddressesProvider","name":"provider","type":"address"}],"name":"getReservesData","outputs":[{"components":[{"internalType":"address","name":"underlyingAsset","type":"address"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint256","name":"decimals","type":"uint256"},{"internalType":"uint256","name":"baseLTVasCollateral","type":"uint256"},{"internalType":"uint256","name":"reserveLiquidationThreshold","type":"uint256"},{"internalType":"uint256","name":"reserveLiquidationBonus","type":"uint256"},{"internalType":"uint256","name":"reserveFactor","type":"uint256"},{"internalType":"bool","name":"usageAsCollateralEnabled","type":"bool"},{"internalType":"bool","name":"borrowingEnabled","type":"bool"},{"internalType":"bool","name":"stableBorrowRateEnabled","type":"bool"},{"internalType":"bool","name":"isActive","type":"bool"},{"internalType":"bool","name":"isFrozen","type":"bool"},{"internalType":"uint128","name":"liquidityIndex","type":"uint128"},{"internalType":"uint128","name":"variableBorrowIndex","type":"uint128"},{"internalType":"uint128","name":"liquidityRate","type":"uint128"},{"internalType":"uint128","name":"variableBorrowRate","type":"uint128"},{"internalType":"uint128","name":"stableBorrowRate","type":"uint128"},{"internalType":"uint40","name":"lastUpdateTimestamp","type":"uint40"},{"internalType":"address","name":"aTokenAddress","type":"address"},{"internalType":"address","name":"stableDebtTokenAddress","type":"address"},{"internalType":"address","name":"variableDebtTokenAddress","type":"address"},{"internalType":"address","name":"interestRateStrategyAddress","type":"address"},{"internalType":"uint256","name":"availableLiquidity","type":"uint256"},{"internalType":"uint256","name":"totalPrincipalStableDebt","type":"uint256"},{"internalType":"uint256","name":"averageStableRate","type":"uint256"},{"internalType":"uint256","name":"stableDebtLastUpdateTimestamp","type":"uint256"},{"internalType":"uint256","name":"totalScaledVariableDebt","type":"uint256"},{"internalType":"uint256","name":"priceInMarketReferenceCurrency","type":"uint256"},{"internalType":"address","name":"priceOracle","type":"address"},{"internalType":"uint256","name":"variableRateSlope1","type":"uint256"},{"internalType":"uint256","name":"variableRateSlope2","type":"uint256"},{"internalType":"uint256","name":"stableRateSlope1","type":"uint256"},{"internalType":"uint256","name":"stableRateSlope2","type":"uint256"},{"internalType":"uint256","name":"baseStableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"baseVariableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"optimalUsageRatio","type":"uint256"},{"internalType":"bool","name":"isPaused","type":"bool"},{"internalType":"bool","name":"isSiloedBorrowing","type":"bool"},{"internalType":"uint128","name":"accruedToTreasury","type":"uint128"},{"internalType":"uint128","name":"unbacked","type":"uint128"},{"internalType":"uint128","name":"isolationModeTotalDebt","type":"uint128"},{"internalType":"bool","name":"flashLoanEnabled","type":"bool"},{"internalType":"uint256","name":"debtCeiling","type":"uint256"},{"internalType":"uint256","name":"debtCeilingDecimals","type":"uint256"},{"internalType":"uint8","name":"eModeCategoryId","type":"uint8"},{"internalType":"uint256","name":"borrowCap","type":"uint256"},{"internalType":"uint256","name":"supplyCap","type":"uint256"},{"internalType":"uint16","name":"eModeLtv","type":"uint16"},{"internalType":"uint16","name":"eModeLiquidationThreshold","type":"uint16"},{"internalType":"uint16","name":"eModeLiquidationBonus","type":"uint16"},{"internalType":"address","name":"eModePriceSource","type":"address"},{"internalType":"string","name":"eModeLabel","type":"string"},{"internalType":"bool","name":"borrowableInIsolation","type":"bool"}],"internalType":"struct IUiPoolDataProviderV3.AggregatedReserveData[]","name":"","type":"tuple[]"},{"components":[{"internalType":"uint256","name":"marketReferenceCurrencyUnit","type":"uint256"},{"internalType":"int256","name":"marketReferenceCurrencyPriceInUsd","type":"int256"},{"internalType":"int256","name":"networkBaseTokenPriceInUsd","type":"int256"},{"internalType":"uint8","name":"networkBaseTokenPriceDecimals","type":"uint8"}],"internalType":"struct IUiPoolDataProviderV3.BaseCurrencyInfo","name":"","type":"tuple"}],"stateMutability":"view","type":"function"}];
    //   const aavetContract = new ethers.Contract(AAVE_CONTRACT_ADDRESS, AAVE_ABI, ethers.provider);
    //   try {
    //     const reserves = await aavetContract.getUserReservesData("0x012bac54348c0e635dcac9d5fb99f06f24136c9a", proxyAddress);//Your own address
    //     let scaledATokenBalance;
    //     let liquidityIndex ;
    //     let liquidityRate;
    //     for (const item of reserves[0]) {
    //       if (item[0]==USDT_CONTRACT_ADDRESS) {
    //         console.log(item);
    //         scaledATokenBalance = item[1];
    //       }
    //     }
    //     const reservesData = await aavetContract.getReservesData("0x012bac54348c0e635dcac9d5fb99f06f24136c9a");
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
    //     const SECONDS_PER_YEAR = 31536000
    //
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

    // const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey(USER_SOLANA_ADDRESS).toBytes())]);//Your own Solana address
    //   // Approve USDT
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(USDT_CONTRACT_ADDRESS)), 32)])
    // let ABI = ["function approve(address to, uint256 tokenId)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("approve", ['0x6ae43d3271ff6888e7fc43fd7321a503ff738951', BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes8","bytes32", "bytes"], [solanaPayloadHead, userAddress, payload_part])
    // console.log(payload)

      // // Deposit USDT, you need to approve USDT before use
      // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951')), 32)])
      // let ABI = ["function supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)"];
      // let iface = new ethers.Interface(ABI);
      // let paras = iface.encodeFunctionData("supply", [USDT_CONTRACT_ADDRESS, 10000000, proxyAddress, 0]);//10usdt, usdt 6-digit precision
      // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
      // const payload = coder.encode(["bytes8","bytes32", "bytes"], [solanaPayloadHead, userAddress, payload_part])
      // console.log(payload)

    //   // withdraw USDT
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951')), 32)])
    // let ABI = ["function withdraw(address asset,uint256 amount,address to)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("withdraw", [USDT_CONTRACT_ADDRESS, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), proxyAddress]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes8","bytes32", "bytes"], [solanaPayloadHead, userAddress, payload_part])
    // console.log(payload)


    // // Deposit ETH
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x387d311e47e80b498169e6fb51d3193167d89F7D')), 32)])
    // let ABI = ["function depositETH(address ,address onBehalfOf,uint16 referralCode)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("depositETH", ['0x6ae43d3271ff6888e7fc43fd7321a503ff738951', proxyAddress, 0]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address,BigInt(10000000000000000), paras]) //0.01eth
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaPayloadHead, userAddress, payload_part])
    // console.log(payload)

    // // approve
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830')), 32)])
    // let ABI = ["function approve(address spender,uint256 amount)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("approve", ['0x387d311e47e80b498169e6fb51d3193167d89f7d', BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaPayloadHead, userAddress, payload_part])
    // console.log(payload)

    // // withdrawETH
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x387d311e47e80b498169e6fb51d3193167d89F7D')), 32)])
    // let ABI = ["function withdrawETH(address ,uint256 amount,address to)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("withdrawETH", ['0x6ae43d3271ff6888e7fc43fd7321a503ff738951', BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), proxyAddress]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaPayloadHead, userAddress, payload_part])
    // console.log(payload)


    //=================================Ethereum Account Control Solana Contract============================================================
    // // Get the address and calculate the Solana address corresponding to ETH
    // const HELLO_WORLD_PID = new PublicKey(RELAYER_SOLANA_CONTRACT);
    // const realForeignEmitterChain = SEPOLIA_CHAIN_ID;
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
//   const UniProxy = await uniProxy_factory.attach(RELAYER_SEPOLIA_CONTRACT);
//   const receipt = await UniProxy.sendMessage(Buffer.concat([sepoliaPayloadHead, RawDataEncoded]));
//   console.log(receipt.hash)
  //   console.log(Buffer.concat([sepoliaPayloadHead, RawDataEncoded]).toString('hex'))

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
    // const UniProxy = await uniProxy_factory.attach(RELAYER_SEPOLIA_CONTRACT);
    // const receipt = await UniProxy.sendMessage(Buffer.concat([sepoliaPayloadHead, RawDataEncoded]));
    // console.log(receipt.hash)


//   //Cross-chain transfer sol
//   const paras = Buffer.from("crosstsf");
//   const buf = Buffer.alloc(8);
//   buf.writeBigUint64LE(BigInt(200000000),0); // The amount transferred across the chain needs to have at least one digit of precision, which means that transferring 0.001 is not possible, but transferring 0.1 is possible. This seems to be a limitation of the cross-chain bridge.
//   const addressBuf = Buffer.from(hexStringToUint8Array('0x049B426457B5A75e0e25F0b692dF581a06035647')) // The Ethereum address to cross the chain to
//   const encodedParams = Buffer.concat([paras, buf, addressBuf]);
//   console.log(encodedParams)

//   const encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:true},{writeable:true, is_signer:false}]);
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
//       programId:HELLO_WORLD_PID.toBuffer(),
//       acc_count:2,
//       accounts:[
//           {
//               key: realForeignEmitter.toBuffer(),
//               isWritable:true,
//               isSigner: true,
//           },
//           {
//             key: new PublicKey("6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF").toBuffer(), //Sol will be transferred to this address first, and it will help you cross the chain
//             isWritable:true,
//             isSigner: false,
//         }
//       ],
//       paras:encodedParams,
//       acc_meta:Buffer.from(encodeMeta),
//   };
//   const RawDataEncoded = Buffer.from(borsh.serialize(RawDataSchema, RawData));
//   console.log(RawDataEncoded);
    // const exp_RawData = borsh.deserialize(RawDataSchema, RawDataEncoded);
    // console.log(exp_RawData);
    // const uniProxy_factory = await ethers.getContractFactory("UniProxy");
    // const UniProxy = await uniProxy_factory.attach('0x438aCC4fB994D97A052d225f0Ca3BF720a3552A9');
    // const receipt = await UniProxy.sendMessage(RawDataEncoded);
    // console.log(receipt.hash)

  // =============Solana account control eth contract Intent-centric transaction=========================================
   const coder = ethers.AbiCoder.defaultAbiCoder();
  // // Query address
  // const uniProxy_factory = await ethers.getContractFactory("UniProxy");
  // const UniProxy = await uniProxy_factory.attach(RELAYER_SEPOLIA_CONTRACT);
  // const sourceChain = SOLANA_CHAIN_ID;// solana
  // const userPadAddress = ethers.zeroPadValue(new PublicKey(USER_SOLANA_ADDRESS).toBytes(), 32);//Your own Solana address
  // const proxyAddress = await UniProxy.proxys(sourceChain, userPadAddress);// Corresponding eth address
  // console.log(proxyAddress);
  // ================Using RBT to transfer SOL to an address on Solana devnet==================
    const TOKEN_BRIDGE_RELAYER_CONTRACT = "0x7Fb0D63258caF51D8A35130d3f7A7fd1EE893969";
    // Query the balance of the wrapped token WSOL on Ethereum
    const WSOL_CONTRACT_ADDRESS = "0x824cb8fc742f8d3300d29f16ca8bee94471169f5";
    // const ERC20_ABI = [
    //     "function balanceOf(address owner) view returns (uint256)",
    //     "function transfer(address to, uint256 value) returns (bool)",
    //     "function approve(address spender,uint256 amount)",
    //     "function allowance(address owner, address spender) view returns (uint256)",
    // ];
    const signer = await ethers.provider.getSigner();
    // const wsolContract = new ethers.Contract(WSOL_CONTRACT_ADDRESS, ERC20_ABI, signer);
  //   const wsolBalance = await wsolContract.balanceOf(proxyAddress); // Precision is 9
  //   // const wsolBalance = await wsolContract.allowance("0x4b9C51891e816F98F7c907c1340891aA12A8902F", TOKEN_BRIDGE_RELAYER_CONTRACT)
  //   console.log(wsolBalance)
  //
  // const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey(USER_SOLANA_ADDRESS).toBytes())]);//Your own Solana address
  // // // approve wsol, this operation is not required every time
  // const byte32WsolContract = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(WSOL_CONTRACT_ADDRESS)), 32)])
  // let approveABI = ["function approve(address spender,uint256 amount)"];
  // let approveIface = new ethers.Interface(approveABI);
  // let approveParas = approveIface.encodeFunctionData("approve", [TOKEN_BRIDGE_RELAYER_CONTRACT, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")]);
  // let approvePayloadPart = coder.encode(["bytes32","uint256", "bytes"], [byte32WsolContract, 0, approveParas])
  // const approvePayload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaPayloadHead, userAddress, approvePayloadPart])
  // console.log(approvePayload)

  // Using RBT to transfer SOL to an address on Solana devnet
  // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(TOKEN_BRIDGE_RELAYER_CONTRACT)), 32)]) //  Token bridge relayer contract address on Ethereum
  // targetRecipient algorithm
  // import {tryNativeToHexString,
  // } from "@certusone/wormhole-sdk";
  // const byte32Address = tryNativeToHexString(
  //     '6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF', // Address on Solana
  //     1
  // );
const targetRecipient = coder.encode(["bytes32"],[Buffer.from(hexStringToUint8Array('f0d2355406cfc953e64d44f046262a2e5639cea31d940e840347820218eb6437'))]);//HD4ktk6LUewd5vMePdQF6ZtvKi3mC41AD3ZM3qJW8N8e
//   let ABI = ["function transferTokensWithRelay(\
//         address token,\
//         uint256 amount,\
//         uint256 toNativeTokenAmount,\
//         uint16 targetChain,\
//         bytes32 targetRecipient,\
//         uint32 batchId\
//     )"];
//   let iface = new ethers.Interface(ABI);
//   let paras = iface.encodeFunctionData("transferTokensWithRelay", [WSOL_CONTRACT_ADDRESS,100000000, 0, 1, targetRecipient , 0]);// sol precision is 9,100000000=0.1sol
//   let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
//   const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaPayloadHead, userAddress, payload_part])
//   console.log(payload)
//
//   // Using LBT to transfer SOL to an address on the Ethereum testnet

  // // approve wsol, this operation is not required every time
  // const approveWsolTx = await wsolContract.approve(TOKEN_BRIDGE_RELAYER_CONTRACT, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
  // console.log(approveWsolTx.hash)

  // transfer SOL

  const TOKEN_BRIDGE_RELAYER_ABI = [
    // {"type":"function","name":"transferTokensWithRelay","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"toNativeTokenAmount","type":"uint256","internalType":"uint256"},{"name":"targetChain","type":"uint16","internalType":"uint16"},{"name":"targetRecipient","type":"bytes32","internalType":"bytes32"},{"name":"batchId","type":"uint32","internalType":"uint32"}],"outputs":[{"name":"messageSequence","type":"uint64","internalType":"uint64"}],"stateMutability":"payable"}
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
    100000000,   //wsol precision is 9,100000000=0.1sol
    0,
    1,
    targetRecipient,
    0,
  );
  console.log(transferTokensWithRelayTx.hash)


  // // Transfer wsol
  // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x824cb8fc742f8d3300d29f16ca8bee94471169f5')), 32)])//wsol contract address
  // let ABI = ["function transfer(address to, uint256 value) returns (bool)"];
  // let iface = new ethers.Interface(ABI);
  // let paras = iface.encodeFunctionData("transfer", ['', BigInt('100000000')]);//0.1swol, wsol 9-digit precision
  // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0 , paras])
  // const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaPayloadHead, userAddress, payload_part])
  // console.log(payload)
  // // Calling and sending messages on Solana

    // // =============Solana controls ETH account to operate lido=========================================
    // const coder = ethers.AbiCoder.defaultAbiCoder();
    // // Query address
    // const uniProxy_factory = await ethers.getContractFactory("UniProxy");
    // const UniProxy = await uniProxy_factory.attach('0x438aCC4fB994D97A052d225f0Ca3BF720a3552A9');
    // const sourceChain = 1;// solana
    // const userPadAddress = ethers.zeroPadValue(new PublicKey("6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF").toBytes(), 32);//Your own Solana address
    // const proxyAddress = await UniProxy.proxys(sourceChain, userPadAddress);// Corresponding eth address
    // console.log(proxyAddress);


    // // stake eth
    // const PROXY_LIDO_CONTRACT_ADDRESS = '0xA8FeCA710468a5Bce62bE5d5d9f21De2b625fA5e'; // Sepolia chain proxy lido contract address
    // const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey("6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF").toBytes())]);//Your own Solana address
    // const byte32WsolContract = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(PROXY_LIDO_CONTRACT_ADDRESS)), 32)])
    // let stakeABI = ["function stake(uint256 lockTime) external payable"];
    // let stakeIface = new ethers.Interface(stakeABI);
    // let stakeParas = stakeIface.encodeFunctionData("stake", [60]); // 60 represents 60s
    // let stakePayloadPart = coder.encode(["bytes32","uint256", "bytes"], [byte32WsolContract, BigInt(10000000000000000), stakeParas]) // stake 0.01eth
    // const stakePayload = coder.encode(["bytes8","bytes32", "bytes"], [solanaPayloadHead, userAddress, stakePayloadPart])
    // console.log(stakePayload)
    // // Solana sends cross-chain messages

    // // Query stake information
    // const ProxyContractLido_factory = await ethers.getContractFactory("EthToStethStaking");
    // const ProxyContractLido = await ProxyContractLido_factory.attach(PROXY_LIDO_CONTRACT_ADDRESS);
    // const [withdrawable, locked] = await ProxyContractLido.getStEthBalance(proxyAddress);
    // console.log(`Withdrawable: ${withdrawable}, Locked: ${locked}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});