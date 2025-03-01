import { Connection, PublicKeyInitData, TransactionInstruction } from "@solana/web3.js";
import { SendTokensParams } from "./types";
export declare function createTransferNativeTokensWithRelayInstruction(connection: Connection, programId: PublicKeyInitData, payer: PublicKeyInitData, tokenBridgeProgramId: PublicKeyInitData, wormholeProgramId: PublicKeyInitData, mint: PublicKeyInitData, params: SendTokensParams): Promise<TransactionInstruction>;
