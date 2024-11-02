import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("Test", function () {
  let owner:any;
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  beforeEach(async function () {
    [owner] = await ethers.getSigners();

  });
  describe("Deployment", function () {
    it("Deployment", async function () {

      const uniProxyFactory = await ethers.getContractFactory("UniProxy");
      const uniProxy = await uniProxyFactory.connect(owner).deploy(owner.address, 200);

      const coder = ethers.AbiCoder.defaultAbiCoder();
      const sourceChain = 4;
      const sourceAddress = "0xaac824d6e431b2a5021ab896d74701cc5fbf5ef13744e48f91fc8c7b3fc70292";
      await uniProxy.setRegisteredSender(sourceChain, sourceAddress);
      const expSender = await uniProxy.registeredSenders(sourceChain);
      expect(expSender).to.equal(sourceAddress);
      expect(await uniProxy.proxys(sourceChain, sourceAddress)).to.equal("0x0000000000000000000000000000000000000000");
    });
  });

});
