/// <reference types="bn.js" />
import { Connection, PublicKeyInitData } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
export declare function createUpdateMaxNativeSwapAmountInstruction(connection: Connection, programId: PublicKeyInitData, payer: PublicKeyInitData, mint: PublicKeyInitData, maxNativeSwapAmount: BN): Promise<import("@solana/web3.js").TransactionInstruction>;
