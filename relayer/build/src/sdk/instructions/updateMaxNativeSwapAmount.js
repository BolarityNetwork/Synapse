"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateMaxNativeSwapAmountInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const program_1 = require("../program");
const accounts_1 = require("../accounts");
async function createUpdateMaxNativeSwapAmountInstruction(connection, programId, payer, mint, maxNativeSwapAmount) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .updateMaxNativeSwapAmount(maxNativeSwapAmount)
        .accounts({
        owner: new web3_js_1.PublicKey(payer),
        config: (0, accounts_1.deriveSenderConfigKey)(programId),
        registeredToken: (0, accounts_1.deriveRegisteredTokenKey)(program.programId, new web3_js_1.PublicKey(mint)),
        mint: new web3_js_1.PublicKey(mint),
    })
        .instruction();
}
exports.createUpdateMaxNativeSwapAmountInstruction = createUpdateMaxNativeSwapAmountInstruction;
//# sourceMappingURL=updateMaxNativeSwapAmount.js.map