import { Connection, PublicKeyInitData } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { TokenBridgeRelayer } from "../../target/types/token_bridge_relayer";
export declare function createTokenBridgeRelayerProgramInterface(connection: Connection, programId: PublicKeyInitData, payer?: PublicKeyInitData): Program<TokenBridgeRelayer>;
