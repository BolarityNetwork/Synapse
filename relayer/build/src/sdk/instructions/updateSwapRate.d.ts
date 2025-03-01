/// <reference types="bn.js" />
import { Connection, PublicKeyInitData } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
export declare function createUpdateSwapRateInstruction(connection: Connection, programId: PublicKeyInitData, owner: PublicKeyInitData, mint: PublicKeyInitData, relayerFee: BN): Promise<import("@solana/web3.js").TransactionInstruction>;
