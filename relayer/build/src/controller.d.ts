/// <reference types="node" />
import { Connection, Keypair } from "@solana/web3.js";
import { ChainId } from "@certusone/wormhole-sdk";
import { Program } from "@coral-xyz/anchor";
import { ParsedVaaWithBytes } from "@wormhole-foundation/relayer-engine/relayer/application";
import { StandardRelayerContext } from "@wormhole-foundation/relayer-engine";
import { ethers } from "ethers";
export interface SendTokensParams {
    amount: number;
    toNativeTokenAmount: number;
    recipientAddress: Buffer;
    recipientChain: ChainId;
    batchId: number;
    wrapNative: boolean;
}
export declare function processSepoliaToSolana(connection: Connection, program: Program, adminKeypair: Keypair, vaa: ParsedVaaWithBytes, ctx: StandardRelayerContext): Promise<[boolean, string]>;
export declare function processSolanaToSepolia(signer: ethers.Signer, contractAbi: {
    [x: string]: ethers.ContractInterface;
}, ctx: StandardRelayerContext): Promise<[boolean, string]>;
