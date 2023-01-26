const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");

module.exports = async (deployer, logger) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);

  logger.logTransaction(
    await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME()),
    "Set dependencies at ConstantsRegistry"
  );
  logger.logTransaction(
    await registry.injectDependencies(await registry.REVIEWABLE_REQUESTS_NAME()),
    "Set dependencies at ReviewableRequests"
  );
};
