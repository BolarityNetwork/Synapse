import { Connection, PublicKey, PublicKeyInitData, TransactionInstruction } from "@solana/web3.js";
import { CompleteTransferWrappedWithPayloadCpiAccounts } from "@certusone/wormhole-sdk/lib/cjs/solana";
import { ParsedTokenTransferVaa, SignedVaa } from "@certusone/wormhole-sdk";
export declare function createCompleteWrappedTransferWithRelayInstruction(connection: Connection, programId: PublicKeyInitData, payer: PublicKeyInitData, feeRecipient: PublicKey, tokenBridgeProgramId: PublicKeyInitData, wormholeProgramId: PublicKeyInitData, wormholeMessage: SignedVaa | ParsedTokenTransferVaa, recipient: PublicKey): Promise<TransactionInstruction>;
export declare function getCompleteTransferWrappedWithPayloadCpiAccounts(tokenBridgeProgramId: PublicKeyInitData, wormholeProgramId: PublicKeyInitData, payer: PublicKeyInitData, vaa: SignedVaa | ParsedTokenTransferVaa, toTokenAccount: PublicKeyInitData): CompleteTransferWrappedWithPayloadCpiAccounts;
