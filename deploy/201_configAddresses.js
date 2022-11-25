const { logTransaction } = require("@dlsl/hardhat-migrate");
const { getConfigJson } = require("./config/config-parser");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");

module.exports = async () => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());

  const addressesConfig = getConfigJson().addresses;

  if (addressesConfig == undefined) {
    return;
  }

  const addresses = Object.keys(addressesConfig);

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const roles = addressesConfig[address];

    if (roles.length == 0) {
      throw new Error(`Empty roles list for address ${address}`);
    }

    logTransaction(await masterAccess.grantRoles(address, roles), `Granted roles to ${address}`);
  }
};
