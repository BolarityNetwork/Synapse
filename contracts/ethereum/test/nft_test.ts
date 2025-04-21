import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("NFT Test", function () {
    let owner:any;
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    beforeEach(async function () {
        [owner] = await ethers.getSigners();

    });
    function hexStringToUint8Array(hexString: string): Uint8Array {
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
    describe("Mint", function () {
        it("Mint", async function () {
            const nft_price = BigInt(50000000000000000)
            const nftFactory = await ethers.getContractFactory("NFT");
            const NFT = await nftFactory.deploy("nft", "BLT", nft_price, 5000); // 0.05ETH
            await expect(NFT.mint({ value: nft_price })).not.to.be.reverted;
            const nextTokenId: number = Number(await NFT.nextTokenId());
            expect(await NFT.ownerOf(nextTokenId - 1)).to.equal(owner.address);
            console.log(await NFT.getOwnedTokens(owner));

            const nftProofFactory = await ethers.getContractFactory("NFTProofRelay");
            const nftProof = await nftProofFactory.deploy(owner, owner, 0);
            await nftProof.setApprovedNFTContract(NFT, true);
            const coder = ethers.AbiCoder.defaultAbiCoder();
            const tokenID = nextTokenId-1;
            const idBuf = Buffer.alloc(8);
            idBuf.writeBigUint64BE(BigInt(tokenID));
            const chainIdBuf = Buffer.alloc(4);
            chainIdBuf.writeUint32BE(10002);
            let address = await NFT.getAddress();
            console.log(owner.address);
            const nftContractToken = coder.encode(["bytes32"],[Buffer.concat([chainIdBuf, idBuf, Buffer.from(hexStringToUint8Array(address))])])
            console.log(nftContractToken);
            // await nftProof.connect(owner).sendProof(nftContractToken,
            //     "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000fffe010000271200011227000000000000000000000000842adb7084103e3ff258da808a1107f4358ec5c1503a911ef42bf340d0a8db9e156020a511f7cc4b9acb2c40e43d0c147eb77486020200000043e6c1e3a935d3e657e3f955d2bd7a737b76eddbab82107fcd10bff521ef5ec501014588d7f50ed05cddf5c6a8dd5b387c4649f2c8c350c029391d2af588b2a3c60601005c000000a53e8f992ae26bca50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111108000000020000000101010000");
       });
    });

});
