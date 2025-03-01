import { Connection, PublicKey, PublicKeyInitData } from "@solana/web3.js";
export declare function deriveRedeemerConfigKey(programId: PublicKeyInitData): PublicKey;
export interface RedeemerConfigData {
    owner: PublicKey;
    bump: number;
    relayerFeePrecision: number;
    feeRecipient: PublicKey;
}
export declare function getRedeemerConfigData(connection: Connection, programId: PublicKeyInitData): Promise<RedeemerConfigData>;
