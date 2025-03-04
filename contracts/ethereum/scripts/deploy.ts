import { ethers} from "hardhat";

async function main() {
    const UniProxy = await ethers.deployContract("UniProxy", ["0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78", 200]);

    await UniProxy.waitForDeployment();

    console.log(
      `deployed to ${UniProxy.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});