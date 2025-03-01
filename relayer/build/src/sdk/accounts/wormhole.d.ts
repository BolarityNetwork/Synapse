import { deriveWormholeEmitterKey } from "@certusone/wormhole-sdk/lib/cjs/solana/wormhole";
import { PublicKey } from "@metaplex-foundation/js";
import { PublicKeyInitData } from "@solana/web3.js";
export { deriveWormholeEmitterKey };
export declare function deriveTokenTransferMessageKey(programId: PublicKeyInitData, payer: PublicKeyInitData, sequence: bigint): PublicKey;
