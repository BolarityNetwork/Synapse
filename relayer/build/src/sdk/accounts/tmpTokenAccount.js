"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveTmpTokenAccountKey = void 0;
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const web3_js_1 = require("@solana/web3.js");
function deriveTmpTokenAccountKey(programId, mint) {
    return (0, solana_1.deriveAddress)([Buffer.from("tmp"), new web3_js_1.PublicKey(mint).toBuffer()], programId);
}
exports.deriveTmpTokenAccountKey = deriveTmpTokenAccountKey;
//# sourceMappingURL=tmpTokenAccount.js.map