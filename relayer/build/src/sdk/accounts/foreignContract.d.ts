/// <reference types="node" />
/// <reference types="bn.js" />
import { ChainId } from "@certusone/wormhole-sdk";
import { Connection, PublicKeyInitData } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
export declare function deriveForeignContractKey(programId: PublicKeyInitData, chain: ChainId): import("@solana/web3.js").PublicKey;
export interface ForeignEmitter {
    chain: ChainId;
    address: Buffer;
    fee: BN;
}
export declare function getForeignContractData(connection: Connection, programId: PublicKeyInitData, chain: ChainId): Promise<ForeignEmitter>;
