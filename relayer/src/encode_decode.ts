import { TokenTransfer } from "@certusone/wormhole-sdk";

export function encodeTokenTransfer(tokenTransfer: TokenTransfer): string {
    try {
        const obj = {
            ...tokenTransfer,
            amount: tokenTransfer.amount.toString(),
            tokenAddress: tokenTransfer.tokenAddress.toString('hex'),
            to: tokenTransfer.to.toString('hex'),
            fee: tokenTransfer.fee !== null ? tokenTransfer.fee.toString() : null,
            fromAddress: tokenTransfer.fromAddress !== null ? tokenTransfer.fromAddress.toString('hex') : null,
            tokenTransferPayload: tokenTransfer.tokenTransferPayload.toString('hex'),
        };

        return JSON.stringify(obj);
    } catch (error) {
        return "";
    }

}

export function decodeTokenTransfer(encoded: string): TokenTransfer {
    try {
        const obj = JSON.parse(encoded);

        return {
            payloadType: obj.payloadType,
            amount: BigInt(obj.amount),
            tokenAddress: Buffer.from(obj.tokenAddress, 'hex'),
            tokenChain: obj.tokenChain,
            to: Buffer.from(obj.to, 'hex'),
            toChain: obj.toChain,
            fee: obj.fee !== null ? BigInt(obj.fee) : null,
            fromAddress: obj.fromAddress !== null ? Buffer.from(obj.fromAddress, 'hex') : null,
            tokenTransferPayload: Buffer.from(obj.tokenTransferPayload, 'hex'),
        };
    } catch (error) {
        return undefined;
    }
}
