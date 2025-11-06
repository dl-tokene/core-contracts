import { Deployer } from "@solarity/hardhat-migrate";

import {
  DeterministicFactory__factory,
  MasterContractsRegistry__factory,
  NativeTokenRequestManager__factory,
} from "@/generated-types";
import { ethers } from "hardhat";

const salt = ethers.id("NativeTokenRequestManager");

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const deterministicFactory = await deployer.deployed(
    DeterministicFactory__factory,
    await registry.getDeterministicFactory(),
  );

  const nativeTokenRequestManagerAddress = await deterministicFactory.deploy.staticCall(
    salt,
    NativeTokenRequestManager__factory.bytecode,
  );
  await deterministicFactory.deploy(salt, NativeTokenRequestManager__factory.bytecode);

  const nativeTokenRequestManager = await deployer.deployed(
    NativeTokenRequestManager__factory,
    nativeTokenRequestManagerAddress,
  );

  await registry.addContract(await registry.NATIVE_TOKEN_REQUEST_MANAGER_NAME(), nativeTokenRequestManager);
};
