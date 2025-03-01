"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeregisterTokenInstruction = exports.createRegisterTokenInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const program_1 = require("../program");
const accounts_1 = require("../accounts");
async function createRegisterTokenInstruction(connection, programId, payer, mint, swap_rate, max_native_swap_amount) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .registerToken(swap_rate, max_native_swap_amount)
        .accounts({
        owner: new web3_js_1.PublicKey(payer),
        config: (0, accounts_1.deriveSenderConfigKey)(program.programId),
        registeredToken: (0, accounts_1.deriveRegisteredTokenKey)(program.programId, new web3_js_1.PublicKey(mint)),
        mint: new web3_js_1.PublicKey(mint),
    })
        .instruction();
}
exports.createRegisterTokenInstruction = createRegisterTokenInstruction;
async function createDeregisterTokenInstruction(connection, programId, payer, mint) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .deregisterToken()
        .accounts({
        owner: new web3_js_1.PublicKey(payer),
        config: (0, accounts_1.deriveSenderConfigKey)(program.programId),
        registeredToken: (0, accounts_1.deriveRegisteredTokenKey)(program.programId, new web3_js_1.PublicKey(mint)),
        mint: new web3_js_1.PublicKey(mint),
    })
        .instruction();
}
exports.createDeregisterTokenInstruction = createDeregisterTokenInstruction;
//# sourceMappingURL=registerToken.js.map