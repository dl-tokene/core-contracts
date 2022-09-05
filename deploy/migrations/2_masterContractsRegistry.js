const { artifacts } = require("hardhat");
const { accounts } = require("../../scripts/helpers/utils");
const { logTransaction } = require("../runners/logger/logger");

const Registry = artifacts.require("MasterContractsRegistry");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const MasterRoleManagement = artifacts.require("MasterRoleManagement");

module.exports = async (deployer) => {
  const REGISTRY_ADMIN = await accounts(1);

  const registry = await deployer.deploy(Registry);
  const proxy = await deployer.deploy(TransparentUpgradeableProxy, registry.address, REGISTRY_ADMIN, []);

  const masterRolesAddress = (await MasterRoleManagement.deployed()).address;

  logTransaction(
    await (await Registry.at(proxy.address)).__MasterContractsRegistry_init(masterRolesAddress),
    "Init ContractsRegistry"
  );
};
