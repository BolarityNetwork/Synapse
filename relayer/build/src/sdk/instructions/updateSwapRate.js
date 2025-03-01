"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateSwapRateInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const program_1 = require("../program");
const accounts_1 = require("../accounts");
async function createUpdateSwapRateInstruction(connection, programId, owner, mint, relayerFee) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .updateSwapRate(relayerFee)
        .accounts({
        owner: new web3_js_1.PublicKey(owner),
        ownerConfig: (0, accounts_1.deriveOwnerConfigKey)(programId),
        registeredToken: (0, accounts_1.deriveRegisteredTokenKey)(program.programId, new web3_js_1.PublicKey(mint)),
        mint: new web3_js_1.PublicKey(mint),
    })
        .instruction();
}
exports.createUpdateSwapRateInstruction = createUpdateSwapRateInstruction;
//# sourceMappingURL=updateSwapRate.js.map