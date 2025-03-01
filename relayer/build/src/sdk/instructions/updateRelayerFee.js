"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateRelayerFeePrecisionInstruction = exports.createUpdateRelayerFeeInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const program_1 = require("../program");
const accounts_1 = require("../accounts");
async function createUpdateRelayerFeeInstruction(connection, programId, payer, chain, relayerFee) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .updateRelayerFee(chain, relayerFee)
        .accounts({
        payer: new web3_js_1.PublicKey(payer),
        ownerConfig: (0, accounts_1.deriveOwnerConfigKey)(program.programId),
        foreignContract: (0, accounts_1.deriveForeignContractKey)(program.programId, chain),
    })
        .instruction();
}
exports.createUpdateRelayerFeeInstruction = createUpdateRelayerFeeInstruction;
async function createUpdateRelayerFeePrecisionInstruction(connection, programId, payer, relayerFeePrecision) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .updateRelayerFeePrecision(relayerFeePrecision)
        .accounts({
        owner: new web3_js_1.PublicKey(payer),
        redeemerConfig: (0, accounts_1.deriveRedeemerConfigKey)(programId),
        senderConfig: (0, accounts_1.deriveSenderConfigKey)(programId),
    })
        .instruction();
}
exports.createUpdateRelayerFeePrecisionInstruction = createUpdateRelayerFeePrecisionInstruction;
//# sourceMappingURL=updateRelayerFee.js.map