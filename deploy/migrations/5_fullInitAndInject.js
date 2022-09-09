const { artifacts } = require("hardhat");
const { accounts } = require("../../scripts/helpers/utils");
const { logTransaction } = require("../runners/logger/logger");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const MasterRoleManagement = artifacts.require("MasterRoleManagement");

const TOKEN_FACTORY_ADMIN_ROLE = "0xd20e79ee7ab22313b1e35bc08d0608b5faca9822ef8dfa3ee1154eb6d6d13df4";

module.exports = async () => {
  const OWNER = await accounts(0);

  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterRoles = await MasterRoleManagement.at(await registry.getMasterRoleManagement());

  logTransaction(
    await registry.injectDependencies(await registry.TOKEN_FACTORY_NAME()),
    "Set dependencies at TokenFactory"
  );

  logTransaction(await masterRoles.grantRole(TOKEN_FACTORY_ADMIN_ROLE, OWNER), "Grant TOKEN_FACTORY_ADMIN_ROLE");
};
