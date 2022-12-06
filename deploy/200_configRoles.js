const { logTransaction } = require("@dlsl/hardhat-migrate");
const { getConfigJson } = require("./config/config-parser");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");

module.exports = async () => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());

  const rolesConfig = getConfigJson().roles;

  if (rolesConfig == undefined) {
    return;
  }

  const roles = Object.keys(rolesConfig);

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];

    let description = rolesConfig[role].description;
    let allowPermissions = rolesConfig[role].allow;
    let disallowPermissions = rolesConfig[role].disallow;

    if (allowPermissions == undefined && disallowPermissions == undefined) {
      throw new Error(`Empty permissions list for role ${role}`);
    }

    description = description == undefined ? "" : description;
    allowPermissions = allowPermissions == undefined ? [] : allowPermissions;
    disallowPermissions = disallowPermissions == undefined ? [] : disallowPermissions;

    logTransaction(
      await masterAccess.addCombinedPermissionsToRole(role, description, allowPermissions, disallowPermissions),
      `Added permissions to role ${role}`
    );
  }
};
