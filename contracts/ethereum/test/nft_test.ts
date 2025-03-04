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
    describe("Mint", function () {
        it("Mint", async function () {
            const nft_price = BigInt(50000000000000000)
            const nftFactory = await ethers.getContractFactory("NFT");
            const NFT = await nftFactory.deploy("nft", "BLT", nft_price); // 0.05ETH
            await expect(NFT.mint({ value: nft_price })).not.to.be.reverted;
            const nextTokenId: number = Number(await NFT.nextTokenId());
            expect(await NFT.ownerOf(nextTokenId - 1)).to.equal(owner.address);
            console.log(await NFT.getOwnedTokens(owner));
       });
    });

});
