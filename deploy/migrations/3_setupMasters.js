const { accounts } = require("../../scripts/utils/utils");
const { logTransaction } = require("../runners/logger/logger");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");

module.exports = async () => {
  const deployerAccount = await accounts(0);

  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterAccessImpl = (await MasterAccessManagement.deployed()).address;

  logTransaction(await registry.__MasterContractsRegistry_init(masterAccessImpl), "Init ContractsRegistry");

  const masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());

  logTransaction(await masterAccess.__MasterAccessManagement_init(deployerAccount), "Init MasterAccessManagement");
};
