import { Deployer } from "@solarity/hardhat-migrate";

import { MasterContractsRegistry__factory, Multicall__factory } from "@/generated-types";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const multicall = await deployer.deploy(Multicall__factory);

  await registry.addProxyContract(await registry.MULTICALL_NAME(), await multicall.getAddress());
};
