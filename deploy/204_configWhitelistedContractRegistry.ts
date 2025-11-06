import { Deployer } from "@solarity/hardhat-migrate";

import {
  IRBAC,
  MasterAccessManagement__factory,
  MasterContractsRegistry__factory,
  ReviewableRequests__factory,
  WhitelistedContractRegistry__factory,
} from "@/generated-types";

const WhitelistedContractRegistryRole = "WCR";
const WHITELISTED_CONTRACT_REGISTRY_RESOURCE = "WHITELISTED_CONTRACT_REGISTRY_RESOURCE";
const UPDATE_PERMISSION = "UPDATE";

const WhitelistedContractRegistryUpdate: IRBAC.ResourceWithPermissionsStruct = {
  resource: WHITELISTED_CONTRACT_REGISTRY_RESOURCE,
  permissions: [UPDATE_PERMISSION],
};

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const whitelistedContractRegistry = await deployer.deployed(
    WhitelistedContractRegistry__factory,
    await registry.getWhitelistedContractRegistry(),
  );
  const reviewableRequests = await deployer.deployed(
    ReviewableRequests__factory,
    await registry.getReviewableRequests(),
  );
  const masterAccess = await deployer.deployed(
    MasterAccessManagement__factory,
    await registry.getMasterAccessManagement(),
  );

  await masterAccess.addPermissionsToRole(WhitelistedContractRegistryRole, [WhitelistedContractRegistryUpdate], true);
  await masterAccess.grantRoles(reviewableRequests, [WhitelistedContractRegistryRole]);

  const preWhitelistedContracts = [
    await registry.getAddress(),
    await registry.getMasterAccessManagement(),
    await registry.getReviewableRequests(),
    await registry.getApproveContractRequests(),
    await registry.getConstantsRegistry(),
    await registry.getMulticall(),
    await registry.getWhitelistedContractRegistry(),
    await registry.getDeterministicFactory(),
    await registry.getNativeTokenRequestManager(),
  ];

  await whitelistedContractRegistry.addWhitelistedContracts(preWhitelistedContracts);
};
