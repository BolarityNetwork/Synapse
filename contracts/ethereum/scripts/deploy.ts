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

// const NcnOperatorStateSchema = {
//   struct:{
//     discriminators:{array: {type:'u8', len:8}},
//     ncn:{array: {type:'u8', len:32}},
//     operator:{array: {type:'u8', len:32}},
//     index:'u64',
//     ncn_opt_in_state: {
//                   struct:{
//                     slot_added:'u64',
//                     slot_removed:'u64',
//                     reserved:{array: {type:'u8', len:32}},
//                   }
//               },
//     operator_opt_in_state: {
//       struct:{
//         slot_added:'u64',
//         slot_removed:'u64',
//         reserved:{array: {type:'u8', len:32}},
//       }
//   },
//   bump:'u8',
//   reserved: {array: {type:'u8', len:263}},
//   }
// };
import * as bs58 from  "bs58";
const NcnSchema = {
    struct:{
        discriminators:{array: {type:'u8', len:8}},
        base:{array: {type:'u8', len:32}},
        admin:{array: {type:'u8', len:32}},
        operator_admin:{array: {type:'u8', len:32}},
        vault_admin:{array: {type:'u8', len:32}},
        slasher_admin:{array: {type:'u8', len:32}},
        delegate_admin:{array: {type:'u8', len:32}},
        metadata_admin:{array: {type:'u8', len:32}},
        weight_table_admin:{array: {type:'u8', len:32}},
        ncn_program_admin:{array: {type:'u8', len:32}},
        index:'u64',
        operator_count:'u64',
        vault_count:'u64',
        slasher_count:'u64',
        bump:'u8',
        reserved: {array: {type:'u8', len:263}},
    }
};


const RelayerInfoSchema = {
    struct:{
        discriminators:{array: {type:'u8', len:8}},
        number:'u16',
        relayer_list:{array: {type:{array: {type:'u8', len:32}},
                len:100}},
    }
};

const BallotBoxSchema = {
    struct:{
        discriminators:{array: {type:'u8', len:8}},
        ncn:{array: {type:'u8', len:32}},
        epoch:'u64',
        bump:'u8',
        slot_created:'u64',
        slot_consensus_reached:'u64',
        reserved: {array: {type:'u8', len:128}},
        operators_voted:'u64',
        unique_ballots:'u64',
        winning_ballot: {struct: {
                meta_merkle_root:{array: {type:'u8', len:32}},
                is_initialized:'u8',
                reserved: {array: {type:'u8', len:63}},
            }},
        operator_votes: {array: {type:{
                    struct:{
                        operator: {array: {type:'u8', len:32}},
                        slot_voted:'u64',
                        stake_weights:{struct:{
                                stake_weight:'u128',
                                ncn_fee_group_stake_weights:{array: {type:{
                                            struct:{
                                                weight:'u128',
                                            }
                                        }, len:8}},
                            }},
                        ballot_index:'u16',
                        reserved: {array: {type:'u8', len:64}},
                    }
                },
                len:256}},
        ballot_tallies:{array: {type:{struct:{
                        index:'u16',
                        ballot:{struct: {
                                meta_merkle_root:{array: {type:'u8', len:32}},
                                is_initialized:'u8',
                                reserved: {array: {type:'u8', len:63}},
                            }},
                        stake_weights:{struct:{
                                stake_weight:'u128',
                                ncn_fee_group_stake_weights:{array: {type:{
                                            struct:{
                                                weight:'u128',
                                            }
                                        }, len:8}},
                            }},
                        tally:'u64',
                    }}, len:256}},
        votes:'u8',
    }
};

const FinalTransactionSchema = {
    struct:{
        discriminators:{array: {type:'u8', len:8}},
        sequence:'u64',
        state_root: {array: {type:'u8', len:32}},
        epoch:'u64',
        accepted:'bool',
        acvotescepted:'u8',
    }
};

async function getOperatorCount(connection:Connection, accountPublicKey:PublicKey) {

    const accountInfo = await connection.getAccountInfo(accountPublicKey);

    if (accountInfo === null) {
        return 0;
    }
    let encoded = borsh.deserialize(NcnSchema, accountInfo.data);
    return encoded.operator_count
}

async function getRelayerCount(connection:Connection, accountPublicKey:PublicKey) {

    const accountInfo = await connection.getAccountInfo(accountPublicKey);

    if (accountInfo === null) {
        return 0;
    }
    let encoded = borsh.deserialize(RelayerInfoSchema, accountInfo.data);
    return encoded.number
}

const genPDAAccount = async (seed:string, programId:PublicKey)=> {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from(seed)
        ],
        programId
    )[0];
}

const genFinalTxPDAAccount = async (programId:PublicKey, epoch:number)=> {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(epoch), 0);
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("final_tx"), buf,
        ],
        programId
    )[0];
}

const genBallotBoxPDAAccount = async (programId:PublicKey, ncn:PublicKey, epoch:number)=> {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(epoch), 0);
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("ballot_box"), ncn.toBuffer(), buf,
        ],
        programId
    )[0];
}

async function getOperatorStateRoot(connection:Connection, accountPublicKey:PublicKey, operator:PublicKey) {

    const accountInfo = await connection.getAccountInfo(accountPublicKey);

    if (accountInfo === null) {
        return 0;
    }
    let encoded = borsh.deserialize(BallotBoxSchema, accountInfo.data);
    let opeartorVotes = encoded.operator_votes;
    let find = false;
    let ballot_index = 0;
    for(const opeartorVote of opeartorVotes) {
        if (opeartorVote.slot_voted!=0) {
            if (bs58.encode(opeartorVote.operator) == bs58.encode(operator.toBuffer())) {
                find = true;
                ballot_index = opeartorVote.ballot_index;
            }
        }
    }
    let state_root = Buffer.alloc(32);
    if(find) {
        let tally = encoded.ballot_tallies[ballot_index];
        state_root= tally.ballot.meta_merkle_root;
    };
    return state_root;
}

async function getFinalTxStatus(connection:Connection, accountPublicKey:PublicKey) {

    const accountInfo = await connection.getAccountInfo(accountPublicKey);

    if (accountInfo === null) {
        return "Uninitialized";
    }
    let encoded = borsh.deserialize(FinalTransactionSchema, accountInfo.data);
    if(encoded.epoch!=0) {
        if (encoded.accepted) {
            return "Accepted";
        } else {
            return "Rejected";
        }
    } else{
        return "Initialized";
    }
}
async function main() {
    // const connection = new Connection(process.env.SOLANA_RPC!, 'confirmed');
    // const epochInfo = await connection.getEpochInfo();
    // const epoch = epochInfo.epoch;
    // console.log(`current epoch: ${epoch}`);

    // const ncn = new PublicKey('8SaaXbfK7A3KuNY38mjc6NoXFZskk6d2hZeRc7snLjaG');
    // const relayerHub = new PublicKey('39djqgS6KR6SWb3T39bTj8QMX3iuMMLP41PVjk89ieJh');
    // const relayerNcn = new PublicKey('4Y4KoE1Tc77EfTg2V6qpCCfeeJa3eu61VxpQ2ih8ebxh');
    // let operatorCount = await getOperatorCount(connection, ncn);
    // console.log('operator count:' + operatorCount);
    // let relayerInfoPDA = await genPDAAccount("relayer_info", relayerHub);
    // let relayerCount = await getRelayerCount(connection, relayerInfoPDA);
    // console.log('relayer count:' + relayerCount);
    // let finalTx = await genFinalTxPDAAccount(relayerHub, epoch - 1);
    // let currentState = await getFinalTxStatus(connection, finalTx);
    // console.log(`current state: ${currentState}`);
    // const operator1 = new PublicKey('J7Wer3xmA1osWfgx8va22v7ZeCC3MtU8QAr6u8FNGfCw');
    // const operator2 = new PublicKey('FqkWuntfHqjXsBN3vmRKwPApKrTGXBCEXn9nQsvP9JjQ');
    // const operator3 = new PublicKey('3u8gESkwKs7nCiQEFZcycZvRU4DheoAe8bW1tHcKvUce');
    // let ballotBox = await genBallotBoxPDAAccount(relayerNcn, ncn, epoch-1);
    // console.log('ballotBox:' + ballotBox);
    // let stateRoot1 = await getOperatorStateRoot(connection, ballotBox, operator1);
    // console.log('operator1 state root:' + bs58.encode(stateRoot1));
    // let stateRoot2 = await getOperatorStateRoot(connection, ballotBox, operator2);
    // console.log('operator2 state root:' + stateRoot2.toString('hex'));
    // let stateRoot3 = await getOperatorStateRoot(connection, ballotBox, operator3);
    // console.log('operator3 state root:' + stateRoot3.toString('hex'));
    // const UniProxy = await ethers.deployContract("UniProxy", ["0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78", 200]);
    //
    // await UniProxy.waitForDeployment();
    //
    // console.log(
    //   `deployed to ${UniProxy.target}`
    // );
    //
    // const targetContractAddressHex = "0x" + deriveWormholeEmitterKey("5tFEXwUwpAzMXBWUSjQNWVfEh7gKbTc5hQMqBwi8jQ7k")
    //     .toBuffer()
    //     .toString("hex")
    //     console.log(targetContractAddressHex)
    // const receipt = await UniProxy.setRegisteredSender(1, targetContractAddressHex);
    // console.log(receipt.hash)
    // const uniProxy_factory = await ethers.getContractFactory("UniProxy");
    // const UniProxy = await uniProxy_factory.attach('0x715BFFb9a0Ac608a24840C7373429B8C0342d6A8');
    // const receipt = await UniProxy.setRegisteredSender(1, targetContractAddressHex);
    // console.log(receipt.hash)

    // =============Solana Account Operation Ethereum Contract=========================================
    const coder = ethers.AbiCoder.defaultAbiCoder();

    // Query address
    const uniProxy_factory = await ethers.getContractFactory("UniProxy");
    const UniProxy = await uniProxy_factory.attach('0xeb485a2BF3567652185617B647d125a14Db5907e');
    const sourceChain = 1;// solana
    const userAddress = ethers.zeroPadValue(new PublicKey("6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF").toBytes(), 32);
    const proxyAddress = await UniProxy.proxys(sourceChain, userAddress);
    console.log(proxyAddress);

    // 0xFE | version (u8) | type (Parser Type, u8)|reserve (u8) | from chain(u16)| to chain(u16)| reserve(24 byte) | data (vec<u8>)
    const solanaChainId = 1;
    const evmChainId = 10002; // sepolia
    const solanaChainIdBuffer = Buffer.alloc(2);
    solanaChainIdBuffer.writeUInt16BE(solanaChainId);
    const evmChainIdBuffer = Buffer.alloc(2);
    evmChainIdBuffer.writeUInt16BE(evmChainId);
    const solanaToEvmHead = Buffer.concat([Buffer.from([0xFE, 0x01, 0x00, 0x00]),  solanaChainIdBuffer, evmChainIdBuffer]);
    // To activate the address, you need to operate on the Solana side and assemble the data
    const contractAddress = new PublicKey("6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF").toBytes();
    const sourceAddress = coder.encode(["bytes32"],[Buffer.from(contractAddress)]);
    const payload = coder.encode(["bytes8", "bytes32", "bytes"], [solanaToEvmHead, sourceAddress, Buffer.from([0])])
    console.log(payload)
    // // Transfer money to an address
    // const sourceContract = coder.encode(["bytes32"],[Buffer.from(new PublicKey("6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF").toBytes())]);
    // const other_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x049B426457B5A75e0e25F0b692dF581a06035647')), 32)])
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [other_address,BigInt(1000000000000000), Buffer.from([0])])
    // const txPayload = coder.encode(["bytes32", "bytes"], [sourceContract, payload_part])
    // console.log(txPayload)

    // // Calling contract methods
    // const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey("HD4ktk6LUewd5vMePdQF6ZtvKi3mC41AD3ZM3qJW8N8e").toBytes())]);
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from([0x8B,0xA7,0x60,0x8b,0x74,0x13,0x75,0x7F,0x01,0x1d,0x76,0x3a,0x19,0xfE,0x17,0xcd,0x58,0x18,0xcD,0xE3]), 32)])
    // let ABI = ["function store(uint256 num)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("store", [666]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address,0, paras])
    // const payload = coder.encode(["bytes32", "bytes"], [userAddress, payload_part])
    // console.log(payload)

    // The above generated payload is passed to message
    // // get sequence
    // const message2 = await getProgramSequenceTracker(provider.connection, program.programId, CORE_BRIDGE_PID)
    //     .then((tracker) =>
    //         deriveAddress(
    //             [
    //               Buffer.from("sent"),
    //               (() => {
    //                 const buf = Buffer.alloc(8);
    //                 buf.writeBigUInt64LE(tracker.sequence + 1n);
    //                 return buf;
    //               })(),
    //             ],
    //             HELLO_WORLD_PID
    //         )
    //     );
    // const wormholeAccounts2 = getPostMessageCpiAccounts(
    //     program.programId,
    //     CORE_BRIDGE_PID,
    //     adminKeypair.publicKey,
    //     message2
    // );

    //  const message = hexStringToUint8Array("")
    //   const ix3 = program.methods
    //       .sendMessage(Buffer.from(message))
    //       .accounts({
    //         config: realConfig,
    //         wormholeProgram: CORE_BRIDGE_PID,
    //         ...wormholeAccounts2,
    //       })
    //       .instruction();
    //   const tx3 = new Transaction().add(await ix3);
    //   try {
    //     let commitment: Commitment = 'confirmed';
    //     await sendAndConfirmTransaction(provider.connection, tx3, [adminKeypair], {commitment});
    //   }
    //   catch (error: any) {
    //     console.log(error);
    //   }

//     // Get the balance of USDT
//     const USDT_CONTRACT_ADDRESS = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
// const USDT_ABI = [
//     "function balanceOf(address owner) view returns (uint256)",
//     "function transfer(address to, uint256 value) returns (bool)",
// ];
// const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, ethers.provider);

// // Get Balance
// const balance = await usdtContract.balanceOf("0xD00c212f8Cc24CdB897D5CE4eD1962Ca0A52f709");//Your own address
// console.log(balance)
// // Transfer usdt
// const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey("6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF").toBytes())]);//Solanda corresponding eth address
//   const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0')), 32)])//usdt contract address
//   let ABI = ["function transfer(address to, uint256 value) returns (bool)"];
//   let iface = new ethers.Interface(ABI);
//   let paras = iface.encodeFunctionData("transfer", ['0xa550C6011DfBA4925abEb0B48104062682870BB8', BigInt('100000000')]);//100usdt, usdt 6-digit precision
//   let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0 , paras])
//   const payload = coder.encode(["bytes32", "bytes"], [userAddress, payload_part])
//   console.log(payload)

    //   // Query the USDT of Deposit
    //   const AAVE_CONTRACT_ADDRESS = "0x69529987fa4a075d0c00b0128fa848dc9ebbe9ce";
    //   const AAVE_ABI = [{"inputs":[{"internalType":"contract IPoolAddressesProvider","name":"provider","type":"address"},{"internalType":"address","name":"user","type":"address"}],"name":"getUserReservesData","outputs":[{"components":[{"internalType":"address","name":"underlyingAsset","type":"address"},{"internalType":"uint256","name":"scaledATokenBalance","type":"uint256"},{"internalType":"bool","name":"usageAsCollateralEnabledOnUser","type":"bool"},{"internalType":"uint256","name":"stableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"scaledVariableDebt","type":"uint256"},{"internalType":"uint256","name":"principalStableDebt","type":"uint256"},{"internalType":"uint256","name":"stableBorrowLastUpdateTimestamp","type":"uint256"}],"internalType":"struct IUiPoolDataProviderV3.UserReserveData[]","name":"","type":"tuple[]"},{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
    // {"inputs":[{"internalType":"contract IPoolAddressesProvider","name":"provider","type":"address"}],"name":"getReservesData","outputs":[{"components":[{"internalType":"address","name":"underlyingAsset","type":"address"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint256","name":"decimals","type":"uint256"},{"internalType":"uint256","name":"baseLTVasCollateral","type":"uint256"},{"internalType":"uint256","name":"reserveLiquidationThreshold","type":"uint256"},{"internalType":"uint256","name":"reserveLiquidationBonus","type":"uint256"},{"internalType":"uint256","name":"reserveFactor","type":"uint256"},{"internalType":"bool","name":"usageAsCollateralEnabled","type":"bool"},{"internalType":"bool","name":"borrowingEnabled","type":"bool"},{"internalType":"bool","name":"stableBorrowRateEnabled","type":"bool"},{"internalType":"bool","name":"isActive","type":"bool"},{"internalType":"bool","name":"isFrozen","type":"bool"},{"internalType":"uint128","name":"liquidityIndex","type":"uint128"},{"internalType":"uint128","name":"variableBorrowIndex","type":"uint128"},{"internalType":"uint128","name":"liquidityRate","type":"uint128"},{"internalType":"uint128","name":"variableBorrowRate","type":"uint128"},{"internalType":"uint128","name":"stableBorrowRate","type":"uint128"},{"internalType":"uint40","name":"lastUpdateTimestamp","type":"uint40"},{"internalType":"address","name":"aTokenAddress","type":"address"},{"internalType":"address","name":"stableDebtTokenAddress","type":"address"},{"internalType":"address","name":"variableDebtTokenAddress","type":"address"},{"internalType":"address","name":"interestRateStrategyAddress","type":"address"},{"internalType":"uint256","name":"availableLiquidity","type":"uint256"},{"internalType":"uint256","name":"totalPrincipalStableDebt","type":"uint256"},{"internalType":"uint256","name":"averageStableRate","type":"uint256"},{"internalType":"uint256","name":"stableDebtLastUpdateTimestamp","type":"uint256"},{"internalType":"uint256","name":"totalScaledVariableDebt","type":"uint256"},{"internalType":"uint256","name":"priceInMarketReferenceCurrency","type":"uint256"},{"internalType":"address","name":"priceOracle","type":"address"},{"internalType":"uint256","name":"variableRateSlope1","type":"uint256"},{"internalType":"uint256","name":"variableRateSlope2","type":"uint256"},{"internalType":"uint256","name":"stableRateSlope1","type":"uint256"},{"internalType":"uint256","name":"stableRateSlope2","type":"uint256"},{"internalType":"uint256","name":"baseStableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"baseVariableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"optimalUsageRatio","type":"uint256"},{"internalType":"bool","name":"isPaused","type":"bool"},{"internalType":"bool","name":"isSiloedBorrowing","type":"bool"},{"internalType":"uint128","name":"accruedToTreasury","type":"uint128"},{"internalType":"uint128","name":"unbacked","type":"uint128"},{"internalType":"uint128","name":"isolationModeTotalDebt","type":"uint128"},{"internalType":"bool","name":"flashLoanEnabled","type":"bool"},{"internalType":"uint256","name":"debtCeiling","type":"uint256"},{"internalType":"uint256","name":"debtCeilingDecimals","type":"uint256"},{"internalType":"uint8","name":"eModeCategoryId","type":"uint8"},{"internalType":"uint256","name":"borrowCap","type":"uint256"},{"internalType":"uint256","name":"supplyCap","type":"uint256"},{"internalType":"uint16","name":"eModeLtv","type":"uint16"},{"internalType":"uint16","name":"eModeLiquidationThreshold","type":"uint16"},{"internalType":"uint16","name":"eModeLiquidationBonus","type":"uint16"},{"internalType":"address","name":"eModePriceSource","type":"address"},{"internalType":"string","name":"eModeLabel","type":"string"},{"internalType":"bool","name":"borrowableInIsolation","type":"bool"}],"internalType":"struct IUiPoolDataProviderV3.AggregatedReserveData[]","name":"","type":"tuple[]"},{"components":[{"internalType":"uint256","name":"marketReferenceCurrencyUnit","type":"uint256"},{"internalType":"int256","name":"marketReferenceCurrencyPriceInUsd","type":"int256"},{"internalType":"int256","name":"networkBaseTokenPriceInUsd","type":"int256"},{"internalType":"uint8","name":"networkBaseTokenPriceDecimals","type":"uint8"}],"internalType":"struct IUiPoolDataProviderV3.BaseCurrencyInfo","name":"","type":"tuple"}],"stateMutability":"view","type":"function"}];
    //   const aavetContract = new ethers.Contract(AAVE_CONTRACT_ADDRESS, AAVE_ABI, ethers.provider);
    //   try {
    //     const reserves = await aavetContract.getUserReservesData("0x012bac54348c0e635dcac9d5fb99f06f24136c9a","0xa550C6011DfBA4925abEb0B48104062682870BB8");//Your own address
    //     let scaledATokenBalance;
    //     let liquidityIndex ;
    //     let liquidityRate;
    //     for (const item of reserves[0]) {
    //       if (item[0]=="0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0") {
    //         console.log(item);
    //         scaledATokenBalance = item[1];
    //       }
    //     }
    //     const reservesData = await aavetContract.getReservesData("0x012bac54348c0e635dcac9d5fb99f06f24136c9a");
    //     for (const item of reservesData[0]) {
    //       if (item[0]=="0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0") {
    //         console.log(item);
    //         liquidityIndex= item[13]
    //         liquidityRate = item[15]
    //       }
    //     }
    //     const tenToThe27: BigInt = BigInt(10 ** 27);
    //     const balance: BigInt = (scaledATokenBalance * liquidityIndex) / tenToThe27;
    //     console.log(balance)//usdt 6-digit precision, self-modify display
    //     // const RAY = BigInt(10**27) // 10 to the power 27
    //     // const SECONDS_PER_YEAR = 31536000

    //     // const depositAPR = liquidityRate/RAY
    //     // console.log(depositAPR);
    //     // // const depositAPY = ((1 + (depositAPR / SECONDS_PER_YEAR)) ^ SECONDS_PER_YEAR) - 1
    //     // const depositAPRNumber = Number(depositAPR) / Number(SECONDS_PER_YEAR);
    //     // const depositAPY = (Math.pow(1 + depositAPRNumber, Number(SECONDS_PER_YEAR)) - 1);
    //     // console.log(depositAPY)
    //   } catch (error) {
    //       console.error('Error fetching reserves data:', error);
    //   }


    // // Calling aave’s contract
    // const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey("6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF").toBytes())]);//Your own Solana address
    // const proxyAddress = '0xD00c212f8Cc24CdB897D5CE4eD1962Ca0A52f709';//Self-generated eth address
    //   // Approve USDT
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0')), 32)])
    // let ABI = ["function approve(address to, uint256 tokenId)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("approve", ['0x6ae43d3271ff6888e7fc43fd7321a503ff738951', BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes32", "bytes"], [userAddress, payload_part])
    // console.log(payload)

    //   // Deposit USDT, you need to approve USDT before use
    //   const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951')), 32)])
    //   let ABI = ["function supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)"];
    //   let iface = new ethers.Interface(ABI);
    //   let paras = iface.encodeFunctionData("supply", ['0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0', 100000000, proxyAddress, 0]);//100usdt, usdt 6-digit precision
    //   let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    //   const payload = coder.encode(["bytes32", "bytes"], [userAddress, payload_part])
    //   console.log(payload)

    //   // withdraw USDT
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951')), 32)])
    // let ABI = ["function withdraw(address asset,uint256 amount,address to)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("withdraw", ['0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0', BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), proxyAddress]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes32", "bytes"], [userAddress, payload_part])
    // console.log(payload)


    // // Deposit ETH
    //   const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x387d311e47e80b498169e6fb51d3193167d89F7D')), 32)])
    // let ABI = ["function depositETH(address ,address onBehalfOf,uint16 referralCode)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("depositETH", ['0x6ae43d3271ff6888e7fc43fd7321a503ff738951', '0xD00c212f8Cc24CdB897D5CE4eD1962Ca0A52f709', 0]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address,BigInt(100000000000000000), paras])
    // const payload = coder.encode(["bytes32", "bytes"], [userAddress, payload_part])
    // console.log(payload)
    // // approve
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830')), 32)])
    // let ABI = ["function approve(address spender,uint256 amount)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("approve", ['0x387d311e47e80b498169e6fb51d3193167d89f7d', BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")]);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes32", "bytes"], [userAddress, payload_part])
    // console.log(payload)

    // // withdrawETH
    // const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x387d311e47e80b498169e6fb51d3193167d89F7D')), 32)])
    // let ABI = ["function withdrawETH(address ,uint256 amount,address to)"];
    // let iface = new ethers.Interface(ABI);
    // let paras = iface.encodeFunctionData("withdrawETH", ['0x6ae43d3271ff6888e7fc43fd7321a503ff738951', BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), '0xD00c212f8Cc24CdB897D5CE4eD1962Ca0A52f709']);
    // let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0, paras])
    // const payload = coder.encode(["bytes32", "bytes"], [userAddress, payload_part])
    // console.log(payload)


    //=================================Ethereum Account Control Solana Contract============================================================
    // // Get the address and calculate the Solana address corresponding to ETH
    // const HELLO_WORLD_PID = new PublicKey("C29LRgV8mDqYXuDbpaaG5LH4TVbPSRkrHebfTBrk9og7");
    // const realForeignEmitterChain = 10002;
    // const ethAddress = rightAlignBuffer(Buffer.from(hexStringToUint8Array('0xa550C6011DfBA4925abEb0B48104062682870BB8')));
    // const addressKey = await deriveEthAddressKey(HELLO_WORLD_PID, realForeignEmitterChain, new PublicKey(ethAddress));
    // console.log(addressKey.toBase58())
    // // //Get Balance
    // // try {
    // //     const balance = await anchor.getProvider().connection.getBalance(addressKey);
    // //     console.log(`${balance / 1e9} SOL`);
    // // }
    // // catch (error: any) {
    // //     console.log(error);
    // // }

//   const myParametersSchema ={ struct: {'value1':'u8', 'value2':'u8'}}
//   class MyParameters {
//     value1: number;
//     value2: number;

//     constructor(value1: number, value2: number) {
//         this.value1 = value1;
//         this.value2 = value2;
//     }
//   }
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
    // //Activation Address
    // const paras = sha256("active").slice(0, 8);
    // const encodedParams = Buffer.concat([paras]);
    // console.log(encodedParams)

//   const encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:false}]);
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
//   console.log(RawDataEncoded);
//   const uniProxy_factory = await ethers.getContractFactory("UniProxy");
//   const UniProxy = await uniProxy_factory.attach('0x715BFFb9a0Ac608a24840C7373429B8C0342d6A8');
//   const receipt = await UniProxy.sendMessage(RawDataEncoded);
//   console.log(receipt.hash)

    // //transfer
    // const paras = sha256("transfer").slice(0, 8);
    // const buf = Buffer.alloc(8);
    // buf.writeBigUint64LE(BigInt(10000000),0);
    // const encodedParams = Buffer.concat([paras, buf]);
    // console.log(encodedParams)
    //
    // const encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:true},{writeable:true, is_signer:false}]);
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
    //             isWritable:true,
    //             isSigner: true,
    //         },
    //         {
    //             key: new PublicKey("HD4ktk6LUewd5vMePdQF6ZtvKi3mC41AD3ZM3qJW8N8e").toBuffer(),
    //             isWritable:true,
    //             isSigner: false,
    //         }
    //     ],
    //     paras:encodedParams,
    //     acc_meta:Buffer.from(encodeMeta),
    // };
    // const RawDataEncoded = Buffer.from(borsh.serialize(RawDataSchema, RawData));
    // console.log(RawDataEncoded);
    // const uniProxy_factory = await ethers.getContractFactory("UniProxy");
    // const UniProxy = await uniProxy_factory.attach('0x715BFFb9a0Ac608a24840C7373429B8C0342d6A8');
    // const receipt = await UniProxy.sendMessage(RawDataEncoded);
    // console.log(receipt.hash)
    // console.log(RawDataEncoded.toString('hex'))


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

// Calling Contract 1
//   const programTest = "DViLwexyLUuKRRXWCQgFYqzoVLWktEbvUVhzKNZ7qTSF";
//   const paras = sha256("global:tet").slice(0, 8);
//   const encodedParams = Buffer.concat([paras]);

//   const encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:true}]);
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
//       programId:new PublicKey(programTest).toBuffer(),
//       acc_count:1,
//       accounts:[
//           {
//               key: realForeignEmitter.toBuffer(),
//               isWritable:true,
//               isSigner: true,
//           }
//       ],
//       paras:encodedParams,
//       acc_meta:Buffer.from(encodeMeta),
//   };
//   const RawDataEncoded = Buffer.from(borsh.serialize(RawDataSchema, RawData));
//   console.log(RawDataEncoded);
//   const uniProxy_factory = await ethers.getContractFactory("UniProxy");
//   const UniProxy = await uniProxy_factory.attach('0x438aCC4fB994D97A052d225f0Ca3BF720a3552A9');
//   const receipt = await UniProxy.sendMessage(RawDataEncoded);
//   console.log(receipt.hash)

//   // Calling Contract 2
//   const programTest = "DViLwexyLUuKRRXWCQgFYqzoVLWktEbvUVhzKNZ7qTSF";
//   const [myStorage, _bump] = PublicKey.findProgramAddressSync([], new PublicKey(programTest));
//   const params = new MyParameters(2, 2);
//   const encoded = borsh.serialize(myParametersSchema, params);
//   const paras = sha256("global:set").slice(0, 8);
//   const encodedParams = Buffer.concat([paras, encoded]);

//   const encodeMeta = borsh.serialize(AccountMeta, [{writeable:true, is_signer:false}]);
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
//       programId:new PublicKey(programTest).toBuffer(),
//       acc_count:1,
//       accounts:[
//           {
//               key: myStorage.toBuffer(),
//               isWritable:true,
//               isSigner: false,
//           }
//       ],
//       paras:encodedParams,
//       acc_meta:Buffer.from(encodeMeta),
//   };
//   const RawDataEncoded = Buffer.from(borsh.serialize(RawDataSchema, RawData));
//   console.log(RawDataEncoded);
//   const uniProxy_factory = await ethers.getContractFactory("UniProxy");
//   const UniProxy = await uniProxy_factory.attach('0x438aCC4fB994D97A052d225f0Ca3BF720a3552A9');
//   const receipt = await UniProxy.sendMessage(RawDataEncoded);
//   console.log(receipt.hash)


//   // =============Solana account control eth contract Intent-centric transaction=========================================
//    const coder = ethers.AbiCoder.defaultAbiCoder();
//   // Query address
//   const uniProxy_factory = await ethers.getContractFactory("UniProxy");
//   const UniProxy = await uniProxy_factory.attach('0x438aCC4fB994D97A052d225f0Ca3BF720a3552A9');
//   const sourceChain = 1;// solana
//   const userPadAddress = ethers.zeroPadValue(new PublicKey("6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF").toBytes(), 32);//Your own Solana address
//   const proxyAddress = await UniProxy.proxys(sourceChain, userPadAddress);// Corresponding eth address
//   console.log(proxyAddress);
//   // ================Using RBT to transfer SOL to an address on Solana devnet==================
    // const TOKEN_BRIDGE_RELAYER_CONTRACT = "0x7Fb0D63258caF51D8A35130d3f7A7fd1EE893969";
    // // Query the balance of the wrapped token WSOL on Ethereum
    // const WSOL_CONTRACT_ADDRESS = "0x824cb8fc742f8d3300d29f16ca8bee94471169f5";
    // const ERC20_ABI = [
    //     "function balanceOf(address owner) view returns (uint256)",
    //     "function transfer(address to, uint256 value) returns (bool)",
    //     "function approve(address spender,uint256 amount)",
    //     "function allowance(address owner, address spender) view returns (uint256)",
    // ];
    // const signer = await ethers.provider.getSigner();
    // const wsolContract = new ethers.Contract(WSOL_CONTRACT_ADDRESS, ERC20_ABI, signer);
    // // const wsolBalance = await wsolContract.balanceOf(proxyAddress); // Precision is 9
    // const wsolBalance = await wsolContract.allowance("0x4b9C51891e816F98F7c907c1340891aA12A8902F", TOKEN_BRIDGE_RELAYER_CONTRACT)
    // console.log(wsolBalance)

//   const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey("6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF").toBytes())]);//Your own Solana address
//   // approve wsol, this operation is not required every time
//   const byte32WsolContract = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(WSOL_CONTRACT_ADDRESS)), 32)])
//   let approveABI = ["function approve(address spender,uint256 amount)"];
//   let approveIface = new ethers.Interface(approveABI);
//   let approveParas = approveIface.encodeFunctionData("approve", [TOKEN_BRIDGE_RELAYER_CONTRACT, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")]);
//   let approvePayloadPart = coder.encode(["bytes32","uint256", "bytes"], [byte32WsolContract, 0, approveParas])
//   const approvePayload = coder.encode(["bytes32", "bytes"], [userAddress, approvePayloadPart])
//   console.log(approvePayload)

//   // Using RBT to transfer SOL to an address on Solana devnet
//   const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array(TOKEN_BRIDGE_RELAYER_CONTRACT)), 32)]) //  Token bridge relayer contract address on Ethereum
//   // targetRecipient algorithm
//   // import {tryNativeToHexString,
//   // } from "@certusone/wormhole-sdk";
//   // const byte32Address = tryNativeToHexString(
//   //     '6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF', // Address on Solana
//   //     1
//   // );
// const targetRecipient = coder.encode(["bytes32"],[Buffer.from(hexStringToUint8Array('f0d2355406cfc953e64d44f046262a2e5639cea31d940e840347820218eb6437'))]);
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
//   const payload = coder.encode(["bytes32", "bytes"], [userAddress, payload_part])
//   console.log(payload)

//   // Using LBT to transfer SOL to an address on the Ethereum testnet

//   // approve wsol, this operation is not required every time
//   const approveWsolTx = await wsolContract.approve(TOKEN_BRIDGE_RELAYER_CONTRACT, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
//   console.log(approveWsolTx.hash)

//   // transfer SOL

//   const TOKEN_BRIDGE_RELAYER_ABI = [
//     // {"type":"function","name":"transferTokensWithRelay","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"toNativeTokenAmount","type":"uint256","internalType":"uint256"},{"name":"targetChain","type":"uint16","internalType":"uint16"},{"name":"targetRecipient","type":"bytes32","internalType":"bytes32"},{"name":"batchId","type":"uint32","internalType":"uint32"}],"outputs":[{"name":"messageSequence","type":"uint64","internalType":"uint64"}],"stateMutability":"payable"}
//   "function transferTokensWithRelay(\
//         address token,\
//         uint256 amount,\
//         uint256 toNativeTokenAmount,\
//         uint16 targetChain,\
//         bytes32 targetRecipient,\
//         uint32 batchId\
//     ) public payable returns (uint64 messageSequence)"
//   ];

//   const tokenBridgeRelayerContract = new ethers.Contract(TOKEN_BRIDGE_RELAYER_CONTRACT, TOKEN_BRIDGE_RELAYER_ABI, signer);
//   const transferTokensWithRelayTx = await tokenBridgeRelayerContract.transferTokensWithRelay(
//     WSOL_CONTRACT_ADDRESS,
//     100000000,   //wsol precision is 9,100000000=0.1sol
//     0,
//     1,
//     targetRecipient,
//     0,
//   );
//   console.log(transferTokensWithRelayTx.hash)


//   // Transfer wsol
//   const userAddress = coder.encode(["bytes32"],[Buffer.from(new PublicKey("6v9YRMJbiXSjwco3evS2XdNuqPbwzKf3ykmn5iQJ4UyF").toBytes())]);//Solanda corresponding eth address
//   const contract_address = coder.encode(["bytes32"],[ethers.zeroPadValue(Buffer.from(hexStringToUint8Array('0x824cb8fc742f8d3300d29f16ca8bee94471169f5')), 32)])//wsol contract address
//   let ABI = ["function transfer(address to, uint256 value) returns (bool)"];
//   let iface = new ethers.Interface(ABI);
//   let paras = iface.encodeFunctionData("transfer", [evm地址, BigInt('100000000')]);//0.1swol, wsol 9-digit precision
//   let payload_part = coder.encode(["bytes32","uint256", "bytes"], [contract_address, 0 , paras])
//   const payload = coder.encode(["bytes32", "bytes"], [userAddress, payload_part])
//   console.log(payload)
//   // Calling and sending messages on Solana

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
    // const stakePayload = coder.encode(["bytes32", "bytes"], [userAddress, stakePayloadPart])
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