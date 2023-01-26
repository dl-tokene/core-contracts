const { accounts } = require("../scripts/utils/utils");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");

module.exports = async (deployer, logger) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());

  const masterRole = await masterAccess.MASTER_ROLE();
  const deployerAccount = await accounts(0);

  logger.logTransaction(
    await masterAccess.revokeRoles(deployerAccount, [masterRole]),
    `Revoked MASTER role from deployer account`
  );
};
