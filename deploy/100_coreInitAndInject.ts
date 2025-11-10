import { Deployer } from "@solarity/hardhat-migrate";

import { DeterministicFactory__factory, MasterContractsRegistry__factory, Multicall__factory } from "@/generated-types";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const multicall = await deployer.deployed(Multicall__factory, await registry.getMulticall());
  await multicall.__Multicall_init();

  const deterministicFactory = await deployer.deployed(
    DeterministicFactory__factory,
    await registry.getDeterministicFactory(),
  );
  await deterministicFactory.__DeterministicFactory_init();

  await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME());
  await registry.injectDependencies(await registry.REVIEWABLE_REQUESTS_NAME());
  await registry.injectDependencies(await registry.MULTICALL_NAME());
  await registry.injectDependencies(await registry.APPROVE_CONTRACT_REQUESTS_NAME());
  await registry.injectDependencies(await registry.WHITELISTED_CONTRACT_REGISTRY_NAME());
  await registry.injectDependencies(await registry.DETERMINISTIC_FACTORY_NAME());
};
