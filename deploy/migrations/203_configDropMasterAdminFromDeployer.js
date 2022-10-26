const { logTransaction } = require("../runners/logger/logger");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");

module.exports = async () => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());

  const masterRole = await masterAccess.MASTER_ROLE();
  const deployer = await accounts(0);

  logTransaction(await masterAccess.revokeRoles(deployer, [masterRole]), `Revoked MASTER role from deployer`);
};
