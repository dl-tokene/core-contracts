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
    const rejectPermissions = rolesConfig[role].reject;

    if (allowPermissions != undefined && allowPermissions.length > 0) {
      logTransaction(
        await masterAccess.addPermissionsToRole(role, allowPermissions, true),
        `Added allow permissions to role ${role}`
      );
    }

    if (rejectPermissions != undefined && rejectPermissions.length > 0) {
      logTransaction(
        await masterAccess.addPermissionsToRole(role, rejectPermissions, false),
        `Added reject permissions to role ${role}`
      );
    }
  }
};
