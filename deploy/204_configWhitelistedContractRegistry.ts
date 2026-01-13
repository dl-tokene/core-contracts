import { Deployer } from "@solarity/hardhat-migrate";

import {
  IRBAC,
  MasterAccessManagement__factory,
  MasterContractsRegistry__factory,
  ExternalProjectRegistry__factory,
  WhitelistedContractRegistry__factory,
} from "@/generated-types";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const whitelistedContractRegistry = await deployer.deployed(
    WhitelistedContractRegistry__factory,
    await registry.getWhitelistedContractRegistry(),
  );

  const preWhitelistedContracts = [
    await registry.getAddress(),
    await registry.getMasterAccessManagement(),
    await registry.getReviewableRequests(),
    await registry.getExternalProjectRegistry(),
    await registry.getConstantsRegistry(),
    // await registry.getMulticall(), // Multicall is not whitelisted
    await registry.getWhitelistedContractRegistry(),
    await registry.getDeterministicFactory(),
    await registry.getNativeTokenRequestManager(),
  ];

  await whitelistedContractRegistry.addWhitelistedContracts(preWhitelistedContracts);
};
