import { Connection, PublicKey, PublicKeyInitData } from "@solana/web3.js";
export declare function deriveOwnerConfigKey(programId: PublicKeyInitData): PublicKey;
export interface OwnerConfigData {
    owner: PublicKey;
    assistant: PublicKey;
    pendingOwner: PublicKey | null;
}
export declare function getOwnerConfigData(connection: Connection, programId: PublicKeyInitData): Promise<OwnerConfigData>;
