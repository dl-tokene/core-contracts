const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const Multicall = artifacts.require("Multicall");

module.exports = async (deployer, logger) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const multicall = await Multicall.at(await registry.getMulticall());

  logger.logTransaction(await multicall.__Multicall_init(), "Init Multicall");

  logger.logTransaction(
    await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME()),
    "Set dependencies at ConstantsRegistry"
  );
  logger.logTransaction(
    await registry.injectDependencies(await registry.REVIEWABLE_REQUESTS_NAME()),
    "Set dependencies at ReviewableRequests"
  );
  logger.logTransaction(
    await registry.injectDependencies(await registry.MULTICALL_NAME()),
    "Set dependencies at Multicall"
  );
};
