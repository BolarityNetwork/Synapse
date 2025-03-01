"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignerSequenceData = exports.deriveSignerSequence = void 0;
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const web3_js_1 = require("@solana/web3.js");
const program_1 = require("../program");
const anchor_1 = require("@coral-xyz/anchor");
function deriveSignerSequence(programId, payerKey) {
    return (0, solana_1.deriveAddress)([Buffer.from("seq"), new web3_js_1.PublicKey(payerKey).toBuffer()], programId);
}
exports.deriveSignerSequence = deriveSignerSequence;
async function getSignerSequenceData(connection, programId, payerKey) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.account.signerSequence
        .fetch(deriveSignerSequence(programId, payerKey))
        .then((acct) => acct.value)
        .catch(() => new anchor_1.BN(0));
}
exports.getSignerSequenceData = getSignerSequenceData;
//# sourceMappingURL=signerSequence.js.map