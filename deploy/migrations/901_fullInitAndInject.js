const { logTransaction } = require("../runners/logger/logger");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");

module.exports = async () => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);

  logTransaction(
    await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME()),
    "Set dependencies at ConstantsRegistry"
  );
  logTransaction(
    await registry.injectDependencies(await registry.REVIEWABLE_REQUESTS_NAME()),
    "Set dependencies at ReviewableRequests"
  );
};
