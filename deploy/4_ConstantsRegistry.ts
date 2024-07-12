import { Deployer } from "@solarity/hardhat-migrate";

import { ConstantsRegistry__factory, MasterContractsRegistry__factory } from "@ethers-v6";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const constantsRegistry = await deployer.deploy(ConstantsRegistry__factory);

  await registry.addProxyContract(await registry.CONSTANTS_REGISTRY_NAME(), (constantsRegistry as any).address);
};
