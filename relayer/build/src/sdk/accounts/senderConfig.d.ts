import { Connection, PublicKey, PublicKeyInitData } from "@solana/web3.js";
export declare function deriveSenderConfigKey(programId: PublicKeyInitData): PublicKey;
export interface SenderConfigData {
    owner: PublicKey;
    bump: number;
    tokenBridge: any;
    relayerFeePrecision: number;
    paused: boolean;
}
export declare function getSenderConfigData(connection: Connection, programId: PublicKeyInitData): Promise<SenderConfigData>;
