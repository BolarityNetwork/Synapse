import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
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
    }
  },
};

export default config;
