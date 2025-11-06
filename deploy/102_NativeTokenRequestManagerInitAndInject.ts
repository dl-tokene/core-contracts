import { Deployer } from "@solarity/hardhat-migrate";

import { MasterContractsRegistry__factory, NativeTokenRequestManager__factory } from "@/generated-types";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const nativeTokenRequestManager = await deployer.deployed(
    NativeTokenRequestManager__factory,
    await registry.getNativeTokenRequestManager(),
  );
  await nativeTokenRequestManager.__NativeTokenRequestManager_init();

  await registry.injectDependencies(await registry.NATIVE_TOKEN_REQUEST_MANAGER_NAME());
};
