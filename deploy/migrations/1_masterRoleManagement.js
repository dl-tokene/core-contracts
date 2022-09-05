const { artifacts } = require("hardhat");

const MasterRoleManagement = artifacts.require("MasterRoleManagement");

module.exports = async (deployer) => {
  await deployer.deploy(MasterRoleManagement);
};
