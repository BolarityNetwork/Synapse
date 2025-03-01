/// <reference types="bn.js" />
import { Connection, PublicKey, PublicKeyInitData } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
export declare function deriveSignerSequence(programId: PublicKeyInitData, payerKey: PublicKeyInitData): PublicKey;
export declare function getSignerSequenceData(connection: Connection, programId: PublicKeyInitData, payerKey: PublicKeyInitData): Promise<BN>;
