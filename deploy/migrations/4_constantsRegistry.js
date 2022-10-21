const { logTransaction } = require("../runners/logger/logger");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const ConstantsRegistry = artifacts.require("ConstantsRegistry");

module.exports = async (deployer) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);

  const constantsRegistry = await deployer.deploy(ConstantsRegistry);

  logTransaction(
    await registry.addProxyContract(await registry.CONSTANTS_REGISTRY_NAME(), constantsRegistry.address),
    "Deploy ConstantsRegistry"
  );
};
