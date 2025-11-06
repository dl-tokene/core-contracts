import { Deployer } from "@solarity/hardhat-migrate";

import { MasterAccessManagement__factory, MasterContractsRegistry__factory } from "@/generated-types";

import { getConfigJson } from "./config/config-parser";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const masterAccess = await deployer.deployed(
    MasterAccessManagement__factory,
    await registry.getMasterAccessManagement(),
  );

  const masterRole = await masterAccess.MASTER_ROLE();
  const deployerAccount = await (await deployer.getSigner()).getAddress();

  const addressesConfig = getConfigJson().addresses;

  if (addressesConfig != undefined && Object.keys(addressesConfig).find((e) => e == deployerAccount) != undefined) {
    const roles = addressesConfig[deployerAccount];

    if (roles.find((e: string) => e == masterRole) != undefined) {
      return;
    }
  }
  await masterAccess.revokeRoles(deployerAccount, [masterRole]);
};
