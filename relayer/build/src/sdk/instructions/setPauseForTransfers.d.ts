import { Connection, PublicKeyInitData } from "@solana/web3.js";
export declare function createSetPauseForTransfersInstruction(connection: Connection, programId: PublicKeyInitData, payer: PublicKeyInitData, paused: boolean): Promise<import("@solana/web3.js").TransactionInstruction>;
