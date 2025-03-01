"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitializeInstruction = exports.getProgramData = exports.BPF_LOADER_UPGRADEABLE_PROGRAM_ID = void 0;
const web3_js_1 = require("@solana/web3.js");
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const program_1 = require("../program");
const accounts_1 = require("../accounts");
exports.BPF_LOADER_UPGRADEABLE_PROGRAM_ID = new web3_js_1.PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
function getProgramData(programId) {
    const [addr] = web3_js_1.PublicKey.findProgramAddressSync([new web3_js_1.PublicKey(programId).toBuffer()], exports.BPF_LOADER_UPGRADEABLE_PROGRAM_ID);
    return addr;
}
exports.getProgramData = getProgramData;
async function createInitializeInstruction(connection, programId, payer, tokenBridgeProgramId, wormholeProgramId, feeRecipient, assistant) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    const { tokenBridgeEmitter, tokenBridgeSequence } = (0, solana_1.getTokenBridgeDerivedAccounts)(program.programId, tokenBridgeProgramId, wormholeProgramId);
    return program.methods
        .initialize(new web3_js_1.PublicKey(feeRecipient), new web3_js_1.PublicKey(assistant))
        .accounts({
        owner: new web3_js_1.PublicKey(payer),
        senderConfig: (0, accounts_1.deriveSenderConfigKey)(programId),
        redeemerConfig: (0, accounts_1.deriveRedeemerConfigKey)(programId),
        ownerConfig: (0, accounts_1.deriveOwnerConfigKey)(programId),
        programData: getProgramData(programId),
        bpfLoaderUpgradeableProgram: exports.BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
        tokenBridgeEmitter,
        tokenBridgeSequence,
    })
        .instruction();
}
exports.createInitializeInstruction = createInitializeInstruction;
//# sourceMappingURL=initialize.js.map