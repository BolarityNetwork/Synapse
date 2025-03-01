/// <reference types="bn.js" />
import { Connection, PublicKey, PublicKeyInitData } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
export declare function deriveRegisteredTokenKey(programId: PublicKeyInitData, mint: PublicKey): PublicKey;
export interface RegisteredTokenData {
    swapRate: BN;
    maxNativeSwapAmount: BN;
}
export declare function getRegisteredTokenData(connection: Connection, programId: PublicKeyInitData, mint: PublicKey): Promise<RegisteredTokenData>;
