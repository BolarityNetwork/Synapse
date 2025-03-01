"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransferWrappedTokensWithRelayInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const program_1 = require("../program");
const accounts_1 = require("../accounts");
const spl_token_1 = require("@solana/spl-token");
const tokenBridge_1 = require("@certusone/wormhole-sdk/lib/cjs/solana/tokenBridge");
const anchor_1 = require("@coral-xyz/anchor");
async function createTransferWrappedTokensWithRelayInstruction(connection, programId, payer, tokenBridgeProgramId, wormholeProgramId, mint, params) {
    const program = (0, program_1.createTokenBridgeRelayerProgramInterface)(connection, programId);
    // Fetch the signer sequence.
    const signerSequence = (0, accounts_1.deriveSignerSequence)(programId, payer);
    const payerSequenceValue = await program.account.signerSequence
        .fetch(signerSequence)
        .then((acct) => acct.value)
        .catch(() => new anchor_1.BN(0));
    const message = (0, accounts_1.deriveTokenTransferMessageKey)(programId, payer, BigInt(payerSequenceValue.toString()));
    const fromTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(new web3_js_1.PublicKey(mint), new web3_js_1.PublicKey(payer));
    const wrappedMeta = await (0, tokenBridge_1.getWrappedMeta)(connection, tokenBridgeProgramId, mint);
    const tmpTokenAccount = (0, accounts_1.deriveTmpTokenAccountKey)(programId, mint);
    const tokenBridgeAccounts = (0, solana_1.getTransferWrappedWithPayloadCpiAccounts)(programId, tokenBridgeProgramId, wormholeProgramId, payer, message, fromTokenAccount, wrappedMeta.chain, wrappedMeta.tokenAddress);
    return program.methods
        .transferWrappedTokensWithRelay(new anchor_1.BN(params.amount.toString()), new anchor_1.BN(params.toNativeTokenAmount.toString()), params.recipientChain, [...params.recipientAddress], params.batchId)
        .accounts({
        config: (0, accounts_1.deriveSenderConfigKey)(programId),
        payerSequence: signerSequence,
        foreignContract: (0, accounts_1.deriveForeignContractKey)(programId, params.recipientChain),
        registeredToken: (0, accounts_1.deriveRegisteredTokenKey)(program.programId, new web3_js_1.PublicKey(mint)),
        tmpTokenAccount: tmpTokenAccount,
        tokenBridgeProgram: new web3_js_1.PublicKey(tokenBridgeProgramId),
        ...tokenBridgeAccounts,
    })
        .instruction();
}
exports.createTransferWrappedTokensWithRelayInstruction = createTransferWrappedTokensWithRelayInstruction;
//# sourceMappingURL=transferWrappedTokensWithRelay.js.map