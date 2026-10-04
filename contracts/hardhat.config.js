require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ quiet: true });

const { ARC_MAINNET_RPC, ARC_TESTNET_RPC, DEPLOYER_PRIVATE_KEY } = process.env;
const accounts = DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [];

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
    // If deployment fails with an invalid-opcode error, add: evmVersion: "paris"
  },
  networks: {
    arcMainnet: {
      url: ARC_MAINNET_RPC || "https://rpc.mainnet.arc.io",
      chainId: 5042,
      accounts,
    },
    arcTestnet: {
      url: ARC_TESTNET_RPC || "https://rpc.testnet.arc.io",
      chainId: 5042002,
      accounts,
    },
  },
};
