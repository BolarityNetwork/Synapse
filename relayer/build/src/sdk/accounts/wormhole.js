"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveTokenTransferMessageKey = exports.deriveWormholeEmitterKey = void 0;
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const wormhole_1 = require("@certusone/wormhole-sdk/lib/cjs/solana/wormhole");
Object.defineProperty(exports, "deriveWormholeEmitterKey", { enumerable: true, get: function () { return wormhole_1.deriveWormholeEmitterKey; } });
const js_1 = require("@metaplex-foundation/js");
function deriveTokenTransferMessageKey(programId, payer, sequence) {
    return (0, solana_1.deriveAddress)([
        Buffer.from("bridged"),
        new js_1.PublicKey(payer).toBuffer(),
        (() => {
            const buf = Buffer.alloc(8);
            buf.writeBigUInt64BE(sequence);
            return buf;
        })(),
    ], programId);
}
exports.deriveTokenTransferMessageKey = deriveTokenTransferMessageKey;
//# sourceMappingURL=wormhole.js.map