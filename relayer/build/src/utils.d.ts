/// <reference types="node" />
import { Connection, TransactionInstruction, Signer, ConfirmOptions, PublicKeyInitData, PublicKey } from "@solana/web3.js";
import { ChainId } from "@certusone/wormhole-sdk";
export declare class SendIxError extends Error {
    logs: string;
    constructor(originalError: Error & {
        logs?: string[];
    });
}
export declare const sendAndConfirmIx: (connection: Connection, ix: TransactionInstruction | Promise<TransactionInstruction>, signer: Signer, computeUnits?: number, options?: ConfirmOptions) => Promise<string>;
export declare function postVaaOnSolana(connection: Connection, payer: Signer, coreBridge: PublicKeyInitData, signedMsg: Buffer): Promise<void>;
export declare function createATAForRecipient(connection: Connection, payer: Signer, tokenBridgeProgramId: PublicKeyInitData, recipient: PublicKey, tokenChain: ChainId, tokenAddress: Buffer): Promise<void>;
export declare function hexStringToUint8Array(hexString: string): Uint8Array;
