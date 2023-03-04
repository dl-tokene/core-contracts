const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const Multicall = artifacts.require("Multicall");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");

module.exports = async (deployer, logger) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);

  const multicall = await Multicall.at(await registry.getMulticall());

  const masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());
  const masterRole = await masterAccess.MASTER_ROLE();

  logger.logTransaction(
    await masterAccess.grantRoles(multicall.address, [masterRole]),
    "Assign master role to Multicall"
  );
};
