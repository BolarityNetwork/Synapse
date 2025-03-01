"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerConfigData = exports.deriveOwnerConfigKey = void 0;
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const program_1 = require("../program");
function deriveOwnerConfigKey(programId) {
    return (0, solana_1.deriveAddress)([Buffer.from("owner")], programId);
}
exports.deriveOwnerConfigKey = deriveOwnerConfigKey;
async function getOwnerConfigData(connection, programId) {
    return (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId).account.ownerConfig.fetch(deriveOwnerConfigKey(programId));
}
exports.getOwnerConfigData = getOwnerConfigData;
//# sourceMappingURL=ownerConfig.js.map