"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSenderConfigData = exports.deriveSenderConfigKey = void 0;
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const program_1 = require("../program");
function deriveSenderConfigKey(programId) {
    return (0, solana_1.deriveAddress)([Buffer.from("sender")], programId);
}
exports.deriveSenderConfigKey = deriveSenderConfigKey;
async function getSenderConfigData(connection, programId) {
    return (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId).account.senderConfig.fetch(deriveSenderConfigKey(programId));
}
exports.getSenderConfigData = getSenderConfigData;
//# sourceMappingURL=senderConfig.js.map