import { Deployer } from "@solarity/hardhat-migrate";

import { MasterContractsRegistry__factory, ExternalProjectRegistry__factory } from "@/generated-types";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const externalProjectRegistry = await deployer.deploy(ExternalProjectRegistry__factory);

  await registry.addProxyContract(
    await registry.EXTERNAL_PROJECT_REGISTRY_NAME(),
    externalProjectRegistry.getAddress(),
  );
};
