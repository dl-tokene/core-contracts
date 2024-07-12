import { Deployer } from "@solarity/hardhat-migrate";

import {
  MasterAccessManagement__factory,
  MasterContractsRegistry__factory,
  Multicall__factory,
} from "@/generated-types";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const multicall = await deployer.deployed(Multicall__factory, await registry.getMulticall());

  const masterAccess = await deployer.deployed(
    MasterAccessManagement__factory,
    await registry.getMasterAccessManagement()
  );
  const masterRole = await masterAccess.MASTER_ROLE();
  await masterAccess.grantRoles(multicall.getAddress(), [masterRole]);
};
