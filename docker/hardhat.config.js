require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-truffle5");
require("@dlsl/hardhat-migrate");
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require("hardhat/builtin-tasks/task-names");

const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const SOLC_VERSION = "0.8.17";

subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args, hre, runSuper) => {
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

module.exports = {
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
};
