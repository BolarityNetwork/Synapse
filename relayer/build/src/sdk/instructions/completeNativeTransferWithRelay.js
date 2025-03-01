"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompleteTransferNativeWithPayloadCpiAccounts = exports.createCompleteNativeTransferWithRelayInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const program_1 = require("../program");
const accounts_1 = require("../accounts");
const wormhole_1 = require("@certusone/wormhole-sdk/lib/cjs/solana/wormhole");
const spl_token_1 = require("@solana/spl-token");
const wormhole_sdk_1 = require("@certusone/wormhole-sdk");
const tokenBridge_1 = require("@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge");
async function createCompleteNativeTransferWithRelayInstruction(connection, programId, payer, feeRecipient, tokenBridgeProgramId, wormholeProgramId, wormholeMessage, recipient) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    const parsed = (0, wormhole_sdk_1.isBytes)(wormholeMessage)
        ? (0, wormhole_sdk_1.parseTokenTransferVaa)(wormholeMessage)
        : wormholeMessage;
    const mint = new web3_js_1.PublicKey(parsed.tokenAddress);
    const tmpTokenAccount = (0, accounts_1.deriveTmpTokenAccountKey)(programId, mint);
    const tokenBridgeAccounts = getCompleteTransferNativeWithPayloadCpiAccounts(tokenBridgeProgramId, wormholeProgramId, payer, parsed, tmpTokenAccount);
    const recipientTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(mint, recipient);
    const feeRecipientTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(mint, feeRecipient);
    return program.methods
        .completeNativeTransferWithRelay([...parsed.hash])
        .accounts({
        config: (0, accounts_1.deriveRedeemerConfigKey)(programId),
        foreignContract: (0, accounts_1.deriveForeignContractKey)(programId, parsed.emitterChain),
        tmpTokenAccount,
        registeredToken: (0, accounts_1.deriveRegisteredTokenKey)(programId, new web3_js_1.PublicKey(mint)),
        nativeRegisteredToken: (0, accounts_1.deriveRegisteredTokenKey)(programId, new web3_js_1.PublicKey(spl_token_1.NATIVE_MINT)),
        recipientTokenAccount,
        recipient,
        feeRecipientTokenAccount,
        tokenBridgeProgram: new web3_js_1.PublicKey(tokenBridgeProgramId),
        ...tokenBridgeAccounts,
    })
        .instruction();
}
exports.createCompleteNativeTransferWithRelayInstruction = createCompleteNativeTransferWithRelayInstruction;
// Temporary
function getCompleteTransferNativeWithPayloadCpiAccounts(tokenBridgeProgramId, wormholeProgramId, payer, vaa, toTokenAccount) {
    const parsed = (0, wormhole_sdk_1.isBytes)(vaa) ? (0, wormhole_sdk_1.parseTokenTransferVaa)(vaa) : vaa;
    const mint = new web3_js_1.PublicKey(parsed.tokenAddress);
    const cpiProgramId = new web3_js_1.PublicKey(parsed.to);
    return {
        payer: new web3_js_1.PublicKey(payer),
        tokenBridgeConfig: (0, tokenBridge_1.deriveTokenBridgeConfigKey)(tokenBridgeProgramId),
        vaa: (0, wormhole_1.derivePostedVaaKey)(wormholeProgramId, parsed.hash),
        tokenBridgeClaim: (0, wormhole_1.deriveClaimKey)(tokenBridgeProgramId, parsed.emitterAddress, parsed.emitterChain, parsed.sequence),
        tokenBridgeForeignEndpoint: (0, tokenBridge_1.deriveEndpointKey)(tokenBridgeProgramId, parsed.emitterChain, parsed.emitterAddress),
        toTokenAccount: new web3_js_1.PublicKey(toTokenAccount),
        tokenBridgeRedeemer: (0, tokenBridge_1.deriveRedeemerAccountKey)(cpiProgramId),
        toFeesTokenAccount: new web3_js_1.PublicKey(toTokenAccount),
        tokenBridgeCustody: (0, tokenBridge_1.deriveCustodyKey)(tokenBridgeProgramId, mint),
        mint,
        tokenBridgeCustodySigner: (0, tokenBridge_1.deriveCustodySignerKey)(tokenBridgeProgramId),
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        systemProgram: web3_js_1.SystemProgram.programId,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        wormholeProgram: new web3_js_1.PublicKey(wormholeProgramId),
    };
}
exports.getCompleteTransferNativeWithPayloadCpiAccounts = getCompleteTransferNativeWithPayloadCpiAccounts;
//# sourceMappingURL=completeNativeTransferWithRelay.js.map