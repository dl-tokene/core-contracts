import "@nomicfoundation/hardhat-ethers";
import "@solarity/hardhat-migrate";

import "@typechain/hardhat";

import "tsconfig-paths/register";

import { HardhatUserConfig, subtask } from "hardhat/config";

import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from "hardhat/builtin-tasks/task-names";

import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const SOLC_VERSION = "0.8.17";

subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args: any, hre, runSuper) => {
  if (args.solcVersion === SOLC_VERSION) {
    const compilerPath = path.join(__dirname, "/node_modules/solc/soljson.js");

    return {
      compilerPath: compilerPath,
      isSolcJs: true,
      version: args.solcVersion,
      longVersion: "",
    };
  }

  return runSuper();
});

function privateKey() {
  return process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
}

const config: HardhatUserConfig = {
  networks: {
    dev: {
      url: `${process.env.DEV_RPC_ENDPOINT}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
  },
  migrate: {
    pathToMigrations: "./deploy/",
  },
  solidity: {
    version: SOLC_VERSION,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: {
      mainnet: `${process.env.ETHERSCAN_KEY}`,
      sepolia: `${process.env.ETHERSCAN_KEY}`,
      bsc: `${process.env.BSCSCAN_KEY}`,
      bscTestnet: `${process.env.BSCSCAN_KEY}`,
    },
  },
  typechain: {
    outDir: "generated-types",
    target: "ethers-v6",
    alwaysGenerateOverloads: true,
    discriminateTypes: true,
  },
};

export default config;
