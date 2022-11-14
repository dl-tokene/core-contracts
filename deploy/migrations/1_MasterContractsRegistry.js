const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");

module.exports = async (deployer) => {
  deployer.startMigrationsBlock = await web3.eth.getBlockNumber();

  const registry = await deployer.deploy(Registry);
  await deployer.deploy(ERC1967Proxy, registry.address, []);
};
