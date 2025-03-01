"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForeignContractData = exports.deriveForeignContractKey = void 0;
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const program_1 = require("../program");
function deriveForeignContractKey(programId, chain) {
    return (0, solana_1.deriveAddress)([
        Buffer.from("foreign_contract"),
        (() => {
            const buf = Buffer.alloc(2);
            buf.writeUInt16BE(chain);
            return buf;
        })(),
    ], programId);
}
exports.deriveForeignContractKey = deriveForeignContractKey;
async function getForeignContractData(connection, programId, chain) {
    const { address, fee } = await (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId).account.foreignContract.fetch(deriveForeignContractKey(programId, chain));
    return {
        chain,
        address: Buffer.from(address),
        fee,
    };
}
exports.getForeignContractData = getForeignContractData;
//# sourceMappingURL=foreignContract.js.map