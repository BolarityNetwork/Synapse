"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateFeeRecipientInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const program_1 = require("../program");
const accounts_1 = require("../accounts");
async function createUpdateFeeRecipientInstruction(connection, programId, payer, newFeeRecipient) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .updateFeeRecipient(new web3_js_1.PublicKey(newFeeRecipient))
        .accounts({
        owner: new web3_js_1.PublicKey(payer),
        redeemerConfig: (0, accounts_1.deriveRedeemerConfigKey)(programId),
    })
        .instruction();
}
exports.createUpdateFeeRecipientInstruction = createUpdateFeeRecipientInstruction;
//# sourceMappingURL=updateFeeRecipient.js.map