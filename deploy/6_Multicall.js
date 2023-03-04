const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const Multicall = artifacts.require("Multicall");

module.exports = async (deployer, logger) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);

  const multicall = await deployer.deploy(Multicall);

  logger.logTransaction(
    await registry.addProxyContract(await registry.MULTICALL_NAME(), multicall.address),
    "Deploy Multicall"
  );
};
