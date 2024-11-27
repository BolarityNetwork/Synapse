import {Connection, PublicKeyInitData, PublicKey} from "@solana/web3.js";
import {Program, Provider} from "@coral-xyz/anchor";

import {TokenBridgeRelayer} from "/home/ubuntu/relayer-engine/examples/hackthon/target/types/token_bridge_relayer";
import IDL from "/home/ubuntu/relayer-engine/examples/hackthon/target/idl/token_bridge_relayer.json";

export function createTokenBridgeRelayerProgramInterface(
  connection: Connection,
  programId: PublicKeyInitData,
  payer?: PublicKeyInitData
): Program<TokenBridgeRelayer> {
  const provider: Provider = {
    connection,
    publicKey: payer == undefined ? undefined : new PublicKey(payer),
  };
      const idl = JSON.parse(
        require("fs").readFileSync("/home/ubuntu/relayer-engine/examples/hackthon/target/idl/token_bridge_relayer.json", "utf8")
    );
  return new Program<TokenBridgeRelayer>(
    idl as any,
    new PublicKey(programId),
    provider
  );
}
