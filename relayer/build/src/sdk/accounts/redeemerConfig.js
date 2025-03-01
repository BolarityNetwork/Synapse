"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedeemerConfigData = exports.deriveRedeemerConfigKey = void 0;
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const program_1 = require("../program");
function deriveRedeemerConfigKey(programId) {
    return (0, solana_1.deriveAddress)([Buffer.from("redeemer")], programId);
}
exports.deriveRedeemerConfigKey = deriveRedeemerConfigKey;
async function getRedeemerConfigData(connection, programId) {
    return (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId).account.redeemerConfig.fetch(deriveRedeemerConfigKey(programId));
}
exports.getRedeemerConfigData = getRedeemerConfigData;
//# sourceMappingURL=redeemerConfig.js.map