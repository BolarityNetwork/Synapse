import { Connection, PublicKeyInitData, TransactionInstruction } from "@solana/web3.js";
export declare function createUpdateFeeRecipientInstruction(connection: Connection, programId: PublicKeyInitData, payer: PublicKeyInitData, newFeeRecipient: PublicKeyInitData): Promise<TransactionInstruction>;
