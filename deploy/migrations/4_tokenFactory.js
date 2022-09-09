const { artifacts } = require("hardhat");
const { logTransaction } = require("../runners/logger/logger");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const TokenFactory = artifacts.require("TokenFactoryRequestable");

module.exports = async (deployer) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);

  const tokenFactory = await deployer.deploy(TokenFactory);

  logTransaction(
    await registry.addProxyContract(await registry.TOKEN_FACTORY_NAME(), tokenFactory.address),
    "Deploy TokenFactory"
  );
};
