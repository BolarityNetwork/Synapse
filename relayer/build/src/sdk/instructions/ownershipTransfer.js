"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateAssistantInstruction = exports.createConfirmOwnershipTransferInstruction = exports.createCancelOwnershipTransferInstruction = exports.createSubmitOwnershipTransferInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const program_1 = require("../program");
const accounts_1 = require("../accounts");
async function createSubmitOwnershipTransferInstruction(connection, programId, owner, newOwner) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .submitOwnershipTransferRequest(new web3_js_1.PublicKey(newOwner))
        .accounts({
        owner: new web3_js_1.PublicKey(owner),
        ownerConfig: (0, accounts_1.deriveOwnerConfigKey)(programId),
    })
        .instruction();
}
exports.createSubmitOwnershipTransferInstruction = createSubmitOwnershipTransferInstruction;
async function createCancelOwnershipTransferInstruction(connection, programId, owner) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .cancelOwnershipTransferRequest()
        .accounts({
        owner: new web3_js_1.PublicKey(owner),
        ownerConfig: (0, accounts_1.deriveOwnerConfigKey)(programId),
    })
        .instruction();
}
exports.createCancelOwnershipTransferInstruction = createCancelOwnershipTransferInstruction;
async function createConfirmOwnershipTransferInstruction(connection, programId, pendingOwner) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .confirmOwnershipTransferRequest()
        .accounts({
        pendingOwner: new web3_js_1.PublicKey(pendingOwner),
        ownerConfig: (0, accounts_1.deriveOwnerConfigKey)(programId),
        senderConfig: (0, accounts_1.deriveSenderConfigKey)(programId),
        redeemerConfig: (0, accounts_1.deriveRedeemerConfigKey)(programId),
    })
        .instruction();
}
exports.createConfirmOwnershipTransferInstruction = createConfirmOwnershipTransferInstruction;
async function createUpdateAssistantInstruction(connection, programId, owner, newAssistant) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    return program.methods
        .updateAssistant(new web3_js_1.PublicKey(newAssistant))
        .accounts({
        owner: new web3_js_1.PublicKey(owner),
        ownerConfig: (0, accounts_1.deriveOwnerConfigKey)(programId),
    })
        .instruction();
}
exports.createUpdateAssistantInstruction = createUpdateAssistantInstruction;
//# sourceMappingURL=ownershipTransfer.js.map