const { artifacts } = require("hardhat");
const { logTransaction } = require("../runners/logger/logger");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const MasterRoleManagement = artifacts.require("MasterRoleManagement");

module.exports = async (deployer) => {
  const registry = await deployer.deploy(Registry);
  const proxy = await deployer.deploy(ERC1967Proxy, registry.address, []);

  const masterRolesAddress = (await MasterRoleManagement.deployed()).address;

  logTransaction(
    await (await Registry.at(proxy.address)).__MasterContractsRegistry_init(masterRolesAddress),
    "Init ContractsRegistry"
  );
};
