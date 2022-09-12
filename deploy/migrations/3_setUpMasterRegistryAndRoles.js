const { artifacts } = require("hardhat");
const { accounts } = require("../../scripts/helpers/utils");
const { logTransaction } = require("../runners/logger/logger");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const MasterRoleManagement = artifacts.require("MasterRoleManagement");

const MASTER_REGISTRY_ADMIN_ROLE = "0xbe3b6931ad58d884ac8399c59bbbed7c5fe116d99ea3833c92a2d6987cefec5d";

module.exports = async (deployer) => {
  const OWNER = await accounts(0);

  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterRoles = await MasterRoleManagement.at(await registry.getMasterRoleManagement());

  logTransaction(await masterRoles.__MasterRoleManagement_init(), "Init MasterRoleManagement");

  logTransaction(await masterRoles.grantRole(MASTER_REGISTRY_ADMIN_ROLE, OWNER), "Grant MASTER_REGISTRY_ADMIN_ROLE");
};
