import { Deployer } from "@solarity/hardhat-migrate";

import { MasterContractsRegistry__factory, WhitelistedContractRegistry__factory } from "@/generated-types";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const whitelistedContractRegistry = await deployer.deploy(WhitelistedContractRegistry__factory);

  await registry.addProxyContract(
    await registry.WHITELISTED_CONTRACT_REGISTRY_NAME(),
    whitelistedContractRegistry.getAddress(),
  );
};
