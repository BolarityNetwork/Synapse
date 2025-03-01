import { Connection, PublicKeyInitData, TransactionInstruction } from "@solana/web3.js";
export declare function createSubmitOwnershipTransferInstruction(connection: Connection, programId: PublicKeyInitData, owner: PublicKeyInitData, newOwner: PublicKeyInitData): Promise<TransactionInstruction>;
export declare function createCancelOwnershipTransferInstruction(connection: Connection, programId: PublicKeyInitData, owner: PublicKeyInitData): Promise<TransactionInstruction>;
export declare function createConfirmOwnershipTransferInstruction(connection: Connection, programId: PublicKeyInitData, pendingOwner: PublicKeyInitData): Promise<TransactionInstruction>;
export declare function createUpdateAssistantInstruction(connection: Connection, programId: PublicKeyInitData, owner: PublicKeyInitData, newAssistant: PublicKeyInitData): Promise<TransactionInstruction>;
