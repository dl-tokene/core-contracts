import { Deployer } from "@solarity/hardhat-migrate";

import {
  ApproveContractRequests__factory,
  IRBAC,
  MasterAccessManagement__factory,
  MasterContractsRegistry__factory,
} from "@/generated-types";

const ReviewableRequestsRole = "RR";
const REVIEWABLE_REQUESTS_RESOURCE = "REVIEWABLE_REQUESTS_RESOURCE";
const CREATE_PERMISSION = "CREATE";
const DELETE_PERMISSION = "DELETE";

const ReviewableRequestsCreateDelete: IRBAC.ResourceWithPermissionsStruct = {
  resource: REVIEWABLE_REQUESTS_RESOURCE,
  permissions: [CREATE_PERMISSION, DELETE_PERMISSION],
};

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const approveContractRequests = await deployer.deployed(
    ApproveContractRequests__factory,
    await registry.getApproveContractRequests(),
  );
  const masterAccess = await deployer.deployed(
    MasterAccessManagement__factory,
    await registry.getMasterAccessManagement(),
  );

  await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsCreateDelete], true);
  await masterAccess.grantRoles(approveContractRequests, [ReviewableRequestsRole]);
};
