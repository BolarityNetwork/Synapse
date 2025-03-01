/// <reference types="bn.js" />
import { Connection, PublicKeyInitData, TransactionInstruction } from "@solana/web3.js";
import { ChainId } from "@certusone/wormhole-sdk";
import { BN } from "@coral-xyz/anchor";
export declare function createUpdateRelayerFeeInstruction(connection: Connection, programId: PublicKeyInitData, payer: PublicKeyInitData, chain: ChainId, relayerFee: BN): Promise<TransactionInstruction>;
export declare function createUpdateRelayerFeePrecisionInstruction(connection: Connection, programId: PublicKeyInitData, payer: PublicKeyInitData, relayerFeePrecision: number): Promise<TransactionInstruction>;
