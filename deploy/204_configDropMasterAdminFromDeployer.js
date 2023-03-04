const { getConfigJson } = require("./config/config-parser");
const { accounts } = require("../scripts/utils/utils");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");

module.exports = async (deployer, logger) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());

  const masterRole = await masterAccess.MASTER_ROLE();
  const deployerAccount = await accounts(0);

  const addressesConfig = getConfigJson().addresses;

  if (addressesConfig != undefined && Object.keys(addressesConfig).find((e) => e == deployerAccount) != undefined) {
    const roles = addressesConfig[deployerAccount];

    if (roles.find((e) => e == masterRole) != undefined) {
      return;
    }
  }

  logger.logTransaction(
    await masterAccess.revokeRoles(deployerAccount, [masterRole]),
    `Revoked MASTER role from deployer account`
  );
};
