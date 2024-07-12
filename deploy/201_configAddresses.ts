import { Deployer } from "@solarity/hardhat-migrate";

import { MasterAccessManagement__factory, MasterContractsRegistry__factory } from "@/generated-types";

import { getConfigJson } from "./config/config-parser";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");
  const masterAccess = await deployer.deployed(
    MasterAccessManagement__factory,
    await registry.getMasterAccessManagement()
  );

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

    await masterAccess.grantRoles(address, roles);
  }
};
