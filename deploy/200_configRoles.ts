import { Deployer } from "@solarity/hardhat-migrate";

import { MasterAccessManagement__factory, MasterContractsRegistry__factory } from "@/generated-types";

import { getConfigJson } from "./config/config-parser";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const masterAccess = await deployer.deployed(
    MasterAccessManagement__factory,
    await registry.getMasterAccessManagement(),
  );

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

    await masterAccess.addCombinedPermissionsToRole(role, description, allowPermissions, disallowPermissions);
  }
};
