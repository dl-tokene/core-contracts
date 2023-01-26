const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const ConstantsRegistry = artifacts.require("ConstantsRegistry");

module.exports = async (deployer, logger) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);

  const constantsRegistry = await deployer.deploy(ConstantsRegistry);

  logger.logTransaction(
    await registry.addProxyContract(await registry.CONSTANTS_REGISTRY_NAME(), constantsRegistry.address),
    "Deploy ConstantsRegistry"
  );
};
