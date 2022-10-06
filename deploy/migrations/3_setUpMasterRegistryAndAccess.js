const { artifacts } = require("hardhat");
const { accounts } = require("../../scripts/helpers/utils");
const { logTransaction } = require("../runners/logger/logger");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");

module.exports = async () => {
  const OWNER = await accounts(0);

  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());

  logTransaction(await masterAccess.__MasterAccessManagement_init(OWNER), "Init MasterAccessManagement");
};
