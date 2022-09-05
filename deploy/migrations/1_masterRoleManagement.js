const { artifacts } = require("hardhat");

const MasterRoleManagement = artifacts.require("MasterRoleManagement");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");

module.exports = async (deployer) => {
  const masterRoles = await deployer.deploy(MasterRoleManagement);
  const proxy = await deployer.deploy(TransparentUpgradeableProxy, masterRoles.address);
};
