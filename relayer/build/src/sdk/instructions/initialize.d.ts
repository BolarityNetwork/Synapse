import { Connection, PublicKey, PublicKeyInitData, TransactionInstruction } from "@solana/web3.js";
export declare const BPF_LOADER_UPGRADEABLE_PROGRAM_ID: PublicKey;
export declare function getProgramData(programId: PublicKeyInitData): PublicKey;
export declare function createInitializeInstruction(connection: Connection, programId: PublicKeyInitData, payer: PublicKeyInitData, tokenBridgeProgramId: PublicKeyInitData, wormholeProgramId: PublicKeyInitData, feeRecipient: PublicKeyInitData, assistant: PublicKeyInitData): Promise<TransactionInstruction>;
