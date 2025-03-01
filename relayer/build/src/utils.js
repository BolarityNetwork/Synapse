"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexStringToUint8Array = exports.createATAForRecipient = exports.postVaaOnSolana = exports.sendAndConfirmIx = exports.SendIxError = void 0;
const web3_js_1 = require("@solana/web3.js");
const tokenBridge_1 = require("@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge");
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const wormhole_sdk_1 = require("@certusone/wormhole-sdk");
const spl_token_1 = require("@solana/spl-token");
class SendIxError extends Error {
    logs;
    constructor(originalError) {
        // The newlines don't actually show up correctly in chai's assertion error, but at least
        // we have all the information and can just replace '\n' with a newline manually to see
        // what's happening without having to change the code.
        const logs = originalError.logs?.join("\n") || "error had no logs";
        super(originalError.message + "\nlogs:\n" + logs);
        this.stack = originalError.stack;
        this.logs = logs;
    }
}
exports.SendIxError = SendIxError;
const sendAndConfirmIx = async (connection, ix, signer, computeUnits, options) => {
    let [signers, units] = (() => {
        if (signer)
            return [[signer], computeUnits];
        return [Array.isArray(signer) ? signer : [signer], computeUnits];
    })();
    if (options === undefined) {
        options = {};
    }
    options.maxRetries = 10;
    const tx = new web3_js_1.Transaction().add(await ix);
    if (units)
        tx.add(web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units }));
    try {
        return await (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, signers, options);
    }
    catch (error) {
        console.log(error);
        throw new SendIxError(error);
    }
};
exports.sendAndConfirmIx = sendAndConfirmIx;
async function postVaaOnSolana(connection, payer, coreBridge, signedMsg) {
    const wallet = solana_1.NodeWallet.fromSecretKey(payer.secretKey);
    await (0, solana_1.postVaaSolanaWithRetry)(connection, wallet.signTransaction, coreBridge, wallet.key(), signedMsg);
}
exports.postVaaOnSolana = postVaaOnSolana;
async function createATAForRecipient(connection, payer, tokenBridgeProgramId, recipient, tokenChain, tokenAddress) {
    // Get the mint.
    let mint;
    if (tokenChain === wormhole_sdk_1.CHAIN_ID_SOLANA) {
        mint = new web3_js_1.PublicKey(tokenAddress);
    }
    else {
        mint = (0, tokenBridge_1.deriveWrappedMintKey)(tokenBridgeProgramId, tokenChain, tokenAddress);
    }
    // Get or create the ATA.
    try {
        await (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, payer, mint, recipient);
    }
    catch (error) {
        throw new Error("Failed to create ATA: " + (error?.stack || error));
    }
}
exports.createATAForRecipient = createATAForRecipient;
function hexStringToUint8Array(hexString) {
    if (hexString.startsWith("0x")) {
        hexString = hexString.slice(2);
    }
    if (hexString.length % 2 !== 0) {
        throw new Error("Invalid hex string length");
    }
    const byteArray = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        const hexPair = hexString.slice(i, i + 2);
        byteArray[i / 2] = parseInt(hexPair, 16);
    }
    return byteArray;
}
exports.hexStringToUint8Array = hexStringToUint8Array;
//# sourceMappingURL=utils.js.map