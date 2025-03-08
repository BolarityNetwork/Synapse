import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  defaultNetwork: process.env.EVM_NETWORK!,
  solidity: {
      compilers: [
          {
              version: '0.8.20',
              settings: {
                  optimizer: {
                      enabled: true,
                      runs: 50,
                  },
              },
          },
      ],
  },
  networks: {
    hardhat: {
      initialDate:'01 Jan 1970 00:00:00 GMT',
    },
    sepolia: {
          url: process.env.EVM_RPC!,
          chainId: 11155111,
          accounts: [
              process.env.USER_EVM_PRIVATE!,
          ]
    }
  },
};

export default config;
