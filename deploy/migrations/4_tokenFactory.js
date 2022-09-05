const { artifacts } = require("hardhat");
const { logTransaction } = require("../runners/logger/logger");

const Registry = artifacts.require("MasterContractsRegistry");
const TransparentUpgradeableProxy = artifacts.require("TransparentUpgradeableProxy");
const TokenFactory = artifacts.require("TokenFactoryRequestable");

module.exports = async (deployer) => {
  const registry = await Registry.at((await TransparentUpgradeableProxy.deployed()).address);

  const tokenFactory = await deployer.deploy(TokenFactory);

  logTransaction(
    await registry.addProxyContract(await registry.TOKEN_FACTORY_NAME(), tokenFactory.address),
    "Deploy TokenFactory"
  );
};
