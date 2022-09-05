const { artifacts } = require("hardhat");

const Registry = artifacts.require("MasterContractsRegistry");

module.exports = async (deployer) => {
  const registry = await deployer.deploy(Registry);
};
