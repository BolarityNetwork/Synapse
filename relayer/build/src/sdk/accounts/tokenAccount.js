"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveTokenAccountKey = void 0;
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const web3_js_1 = require("@solana/web3.js");
function deriveTokenAccountKey(programId, mint) {
    return (0, solana_1.deriveAddress)([Buffer.from("token"), new web3_js_1.PublicKey(mint).toBuffer()], programId);
}
exports.deriveTokenAccountKey = deriveTokenAccountKey;
//# sourceMappingURL=tokenAccount.js.map