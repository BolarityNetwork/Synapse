"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegisteredTokenData = exports.deriveRegisteredTokenKey = void 0;
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const program_1 = require("../program");
function deriveRegisteredTokenKey(programId, mint) {
    return (0, solana_1.deriveAddress)([Buffer.from("mint"), mint.toBuffer()], programId);
}
exports.deriveRegisteredTokenKey = deriveRegisteredTokenKey;
async function getRegisteredTokenData(connection, programId, mint) {
    return (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId).account.registeredToken.fetch(deriveRegisteredTokenKey(programId, mint));
}
exports.getRegisteredTokenData = getRegisteredTokenData;
//# sourceMappingURL=registeredToken.js.map