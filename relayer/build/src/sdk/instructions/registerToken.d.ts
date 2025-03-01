/// <reference types="bn.js" />
import { Connection, PublicKeyInitData, TransactionInstruction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
export declare function createRegisterTokenInstruction(connection: Connection, programId: PublicKeyInitData, payer: PublicKeyInitData, mint: PublicKeyInitData, swap_rate: BN, max_native_swap_amount: BN): Promise<TransactionInstruction>;
export declare function createDeregisterTokenInstruction(connection: Connection, programId: PublicKeyInitData, payer: PublicKeyInitData, mint: PublicKeyInitData): Promise<TransactionInstruction>;
