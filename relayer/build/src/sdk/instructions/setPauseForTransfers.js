"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSetPauseForTransfersInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const program_1 = require("../program");
const accounts_1 = require("../accounts");
async function createSetPauseForTransfersInstruction(connection, programId, payer, paused) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .setPauseForTransfers(paused)
        .accounts({
        owner: new web3_js_1.PublicKey(payer),
        config: (0, accounts_1.deriveSenderConfigKey)(programId),
    })
        .instruction();
}
exports.createSetPauseForTransfersInstruction = createSetPauseForTransfersInstruction;
//# sourceMappingURL=setPauseForTransfers.js.map