"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTokenBridgeRelayerProgramInterface = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const token_bridge_relayer_json_1 = require("../../target/idl/token_bridge_relayer.json");
function createTokenBridgeRelayerProgramInterface(connection, programId, payer) {
    const provider = {
        connection,
        publicKey: payer == undefined ? undefined : new web3_js_1.PublicKey(payer),
    };
    //   const idl = JSON.parse(
    //     require("fs").readFileSync("../../idl/token_bridge_relayer.json", "utf8")
    // );
    return new anchor_1.Program(token_bridge_relayer_json_1.default);
}
exports.createTokenBridgeRelayerProgramInterface = createTokenBridgeRelayerProgramInterface;
//# sourceMappingURL=program.js.map