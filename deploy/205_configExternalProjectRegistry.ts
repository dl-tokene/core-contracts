import { Deployer } from "@solarity/hardhat-migrate";

import {
  ExternalProjectRegistry__factory,
  IRBAC,
  MasterAccessManagement__factory,
  MasterContractsRegistry__factory,
  ReviewableRequests__factory,
} from "@/generated-types";

const ReviewableRequestsRole = "RR";
const RBACRole = "RBAC";
const WhitelistedContractRegistryRole = "WCR";
const ExternalProjectRegistryRole = "EPR";

const CREATE_PERMISSION = "CREATE";
const UPDATE_PERMISSION = "UPDATE";
const DELETE_PERMISSION = "DELETE";

const REVIEWABLE_REQUESTS_RESOURCE = "REVIEWABLE_REQUESTS_RESOURCE";
const RBAC_RESOURCE = "RBAC_RESOURCE";
const WHITELISTED_CONTRACT_REGISTRY_RESOURCE = "WHITELISTED_CONTRACT_REGISTRY_RESOURCE";
const EXTERNAL_PROJECT_REGISTRY_RESOURCE = "EXTERNAL_PROJECT_REGISTRY_RESOURCE";

const ReviewableRequestsCreateDelete: IRBAC.ResourceWithPermissionsStruct = {
  resource: REVIEWABLE_REQUESTS_RESOURCE,
  permissions: [CREATE_PERMISSION, DELETE_PERMISSION, UPDATE_PERMISSION],
};

const RBACCreate: IRBAC.ResourceWithPermissionsStruct = {
  resource: RBAC_RESOURCE,
  permissions: [CREATE_PERMISSION],
};

const WhitelistedContractRegistryUpdate: IRBAC.ResourceWithPermissionsStruct = {
  resource: WHITELISTED_CONTRACT_REGISTRY_RESOURCE,
  permissions: [UPDATE_PERMISSION],
};

const ExternalProjectRegistryCreate: IRBAC.ResourceWithPermissionsStruct = {
  resource: EXTERNAL_PROJECT_REGISTRY_RESOURCE,
  permissions: [CREATE_PERMISSION, UPDATE_PERMISSION],
};

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const externalProjectRegistry = await deployer.deployed(
    ExternalProjectRegistry__factory,
    await registry.getExternalProjectRegistry(),
  );
  const reviewableRequests = await deployer.deployed(
    ReviewableRequests__factory,
    await registry.getReviewableRequests(),
  );
  const masterAccess = await deployer.deployed(
    MasterAccessManagement__factory,
    await registry.getMasterAccessManagement(),
  );

  await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsCreateDelete], true);
  await masterAccess.grantRoles(externalProjectRegistry, [ReviewableRequestsRole]);

  await masterAccess.addPermissionsToRole(RBACRole, [RBACCreate], true);
  await masterAccess.grantRoles(externalProjectRegistry, [RBACRole]);

  await masterAccess.addPermissionsToRole(WhitelistedContractRegistryRole, [WhitelistedContractRegistryUpdate], true);
  await masterAccess.grantRoles(externalProjectRegistry, [WhitelistedContractRegistryRole]);

  await masterAccess.addPermissionsToRole(ExternalProjectRegistryRole, [ExternalProjectRegistryCreate], true);
  await masterAccess.grantRoles(reviewableRequests, [ExternalProjectRegistryRole]);
};
