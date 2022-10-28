const { logTransaction } = require("../runners/logger/logger");
const { getConfigJson } = require("../config/config-parser");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");

module.exports = async () => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());

  const rolesConfig = getConfigJson().roles;
  const roles = Object.keys(rolesConfig);

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    const allowPermissions = rolesConfig[role].allow;
    const disallowPermissions = rolesConfig[role].disallow;

    if (allowPermissions != undefined) {
      if (allowPermissions.length == 0) {
        throw new Error(`Empty allow permissions list for role ${role}`);
      }

      logTransaction(
        await masterAccess.addPermissionsToRole(role, allowPermissions, true),
        `Added allow permissions to role ${role}`
      );
    }

    if (disallowPermissions != undefined) {
      if (disallowPermissions.length == 0) {
        throw new Error(`Empty disallow permissions list for role ${role}`);
      }

      logTransaction(
        await masterAccess.addPermissionsToRole(role, disallowPermissions, false),
        `Added disallow permissions to role ${role}`
      );
    }
  }
};
