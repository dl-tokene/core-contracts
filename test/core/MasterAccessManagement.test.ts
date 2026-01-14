import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@/test/helpers/reverter";

import {
  CREATE_PERMISSION,
  DELETE_PERMISSION,
  CONSTANTS_REGISTRY_RESOURCE,
  MASTER_REGISTRY_RESOURCE,
  UPDATE_PERMISSION,
  REVIEWABLE_REQUESTS_RESOURCE,
  EXECUTE_PERMISSION,
  DETERMINISTIC_FACTORY_RESOURCE,
  DEPLOY_PERMISSION,
  MINT_PERMISSION,
  NATIVE_TOKEN_REQUEST_MANAGER_RESOURCE,
  BURN_PERMISSION,
  WHITELISTED_CONTRACT_REGISTRY_RESOURCE,
  EXTERNAL_PROJECT_REGISTRY_RESOURCE,
} from "../utils/constants";

import { IRBAC, MasterAccessManagement } from "@ethers-v6";

describe("MasterAccessManagement", async () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let USER1: SignerWithAddress;

  let masterAccess: MasterAccessManagement;

  const MasterContractsRegistryRole = "MCR";
  const ConstantsRegistryRole = "CR";
  const ReviewableRequestsRole = "RR";
  const NativeTokenRequestManagerRole = "NTRM";
  const ExternalProjectRegistryRole = "EPR";
  const WhitelistedContractRegistryRole = "WCR";
  const DeterministicFactoryRole = "DF";

  const MasterContractsRegistryCreate: IRBAC.ResourceWithPermissionsStruct = {
    resource: MASTER_REGISTRY_RESOURCE,
    permissions: [CREATE_PERMISSION],
  };
  const MasterContractsRegistryUpdate: IRBAC.ResourceWithPermissionsStruct = {
    resource: MASTER_REGISTRY_RESOURCE,
    permissions: [UPDATE_PERMISSION],
  };
  const MasterContractsRegistryDelete: IRBAC.ResourceWithPermissionsStruct = {
    resource: MASTER_REGISTRY_RESOURCE,
    permissions: [DELETE_PERMISSION],
  };

  const ConstantsRegistryCreate: IRBAC.ResourceWithPermissionsStruct = {
    resource: CONSTANTS_REGISTRY_RESOURCE,
    permissions: [CREATE_PERMISSION],
  };
  const ConstantsRegistryDelete: IRBAC.ResourceWithPermissionsStruct = {
    resource: CONSTANTS_REGISTRY_RESOURCE,
    permissions: [DELETE_PERMISSION],
  };

  const ReviewableRequestsCreate: IRBAC.ResourceWithPermissionsStruct = {
    resource: REVIEWABLE_REQUESTS_RESOURCE,
    permissions: [CREATE_PERMISSION],
  };
  const ReviewableRequestsExecute: IRBAC.ResourceWithPermissionsStruct = {
    resource: REVIEWABLE_REQUESTS_RESOURCE,
    permissions: [EXECUTE_PERMISSION],
  };
  const ReviewableRequestsDelete: IRBAC.ResourceWithPermissionsStruct = {
    resource: REVIEWABLE_REQUESTS_RESOURCE,
    permissions: [DELETE_PERMISSION],
  };

  const NativeTokenRequestManagerMint: IRBAC.ResourceWithPermissionsStruct = {
    resource: NATIVE_TOKEN_REQUEST_MANAGER_RESOURCE,
    permissions: [MINT_PERMISSION],
  };
  const NativeTokenRequestManagerBurn: IRBAC.ResourceWithPermissionsStruct = {
    resource: NATIVE_TOKEN_REQUEST_MANAGER_RESOURCE,
    permissions: [BURN_PERMISSION],
  };

  const ExternalProjectRegistryCreate: IRBAC.ResourceWithPermissionsStruct = {
    resource: EXTERNAL_PROJECT_REGISTRY_RESOURCE,
    permissions: [CREATE_PERMISSION],
  };

  const ExternalProjectRegistryUpdate: IRBAC.ResourceWithPermissionsStruct = {
    resource: EXTERNAL_PROJECT_REGISTRY_RESOURCE,
    permissions: [UPDATE_PERMISSION],
  };

  const WhitelistedContractRegistryUpdate: IRBAC.ResourceWithPermissionsStruct = {
    resource: WHITELISTED_CONTRACT_REGISTRY_RESOURCE,
    permissions: [UPDATE_PERMISSION],
  };

  const DeterministicFactoryDeploy: IRBAC.ResourceWithPermissionsStruct = {
    resource: DETERMINISTIC_FACTORY_RESOURCE,
    permissions: [DEPLOY_PERMISSION],
  };

  before("setup", async () => {
    [OWNER, USER1] = await ethers.getSigners();

    const MasterAccessManagementFactory = await ethers.getContractFactory("MasterAccessManagement");
    masterAccess = await MasterAccessManagementFactory.deploy();

    await masterAccess.__MasterAccessManagement_init(OWNER);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("basic access", () => {
    it("should not initialize twice", async () => {
      await expect(masterAccess.__MasterAccessManagement_init(OWNER)).to.be.rejectedWith(
        "Initializable: contract is already initialized",
      );
    });
  });

  describe("getters", () => {
    describe("MasterContractsRegistry", () => {
      it("should correctly check access for hasMasterContractsRegistryCreatePermission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryCreate], true);

        expect(await masterAccess.hasMasterContractsRegistryCreatePermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        expect(await masterAccess.hasMasterContractsRegistryCreatePermission(USER1)).to.be.true;
      });

      it("should correctly check access for hasMasterContractsRegistryUpdatePermission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryUpdate], true);

        expect(await masterAccess.hasMasterContractsRegistryUpdatePermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        expect(await masterAccess.hasMasterContractsRegistryUpdatePermission(USER1)).to.be.true;
      });

      it("should correctly check access for hasMasterContractsRegistryDeletePermission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryDelete], true);

        expect(await masterAccess.hasMasterContractsRegistryDeletePermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        expect(await masterAccess.hasMasterContractsRegistryDeletePermission(USER1)).to.be.true;
      });
    });

    describe("ConstantsRegistry", () => {
      it("should correctly check access for hasConstantsRegistryCreatePermission", async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);

        expect(await masterAccess.hasConstantsRegistryCreatePermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);

        expect(await masterAccess.hasConstantsRegistryCreatePermission(USER1)).to.be.true;
      });

      it("should correctly check access for hasConstantsRegistryDeletePermission", async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryDelete], true);

        expect(await masterAccess.hasConstantsRegistryDeletePermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);

        expect(await masterAccess.hasConstantsRegistryDeletePermission(USER1)).to.be.true;
      });
    });

    describe("ReviewableRequests", () => {
      it("should correctly check access for hasReviewableRequestsCreatePermission", async () => {
        await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsCreate], true);

        expect(await masterAccess.hasReviewableRequestsCreatePermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

        expect(await masterAccess.hasReviewableRequestsCreatePermission(USER1)).to.be.true;
      });

      it("should correctly check access for hasReviewableRequestsExecutePermission", async () => {
        await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsExecute], true);

        expect(await masterAccess.hasReviewableRequestsExecutePermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

        expect(await masterAccess.hasReviewableRequestsExecutePermission(USER1)).to.be.true;
      });

      it("should correctly check access for hasReviewableRequestsDeletePermission", async () => {
        await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsDelete], true);

        expect(await masterAccess.hasReviewableRequestsDeletePermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

        expect(await masterAccess.hasReviewableRequestsDeletePermission(USER1)).to.be.true;
      });

      it("should correctly check access for hasNativeTokenRequestManagerMintPermission", async () => {
        await masterAccess.addPermissionsToRole(NativeTokenRequestManagerRole, [NativeTokenRequestManagerMint], true);

        expect(await masterAccess.hasNativeTokenRequestManagerMintPermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [NativeTokenRequestManagerRole]);

        expect(await masterAccess.hasNativeTokenRequestManagerMintPermission(USER1)).to.be.true;
      });

      it("should correctly check access for hasNativeTokenRequestManagerBurnPermission", async () => {
        await masterAccess.addPermissionsToRole(NativeTokenRequestManagerRole, [NativeTokenRequestManagerBurn], true);

        expect(await masterAccess.hasNativeTokenRequestManagerBurnPermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [NativeTokenRequestManagerRole]);

        expect(await masterAccess.hasNativeTokenRequestManagerBurnPermission(USER1)).to.be.true;
      });

      it("should correctly check access for hasExternalProjectRegistryCreatePermission", async () => {
        await masterAccess.addPermissionsToRole(ExternalProjectRegistryRole, [ExternalProjectRegistryCreate], true);

        expect(await masterAccess.hasExternalProjectRegistryCreatePermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [ExternalProjectRegistryRole]);

        expect(await masterAccess.hasExternalProjectRegistryCreatePermission(USER1)).to.be.true;
      });

      it("should correctly check access for hasExternalProjectRegistryUpdatePermission", async () => {
        await masterAccess.addPermissionsToRole(ExternalProjectRegistryRole, [ExternalProjectRegistryUpdate], true);

        expect(await masterAccess.hasExternalProjectRegistryUpdatePermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [ExternalProjectRegistryRole]);

        expect(await masterAccess.hasExternalProjectRegistryUpdatePermission(USER1)).to.be.true;
      });

      it("should correctly check access for hasWhitelistedContractRegistryUpdatePermission", async () => {
        await masterAccess.addPermissionsToRole(
          WhitelistedContractRegistryRole,
          [WhitelistedContractRegistryUpdate],
          true,
        );

        expect(await masterAccess.hasWhitelistedContractRegistryUpdatePermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [WhitelistedContractRegistryRole]);

        expect(await masterAccess.hasWhitelistedContractRegistryUpdatePermission(USER1)).to.be.true;
      });

      it("should correctly check access for hasDeterministicFactoryDeployPermission", async () => {
        await masterAccess.addPermissionsToRole(DeterministicFactoryRole, [DeterministicFactoryDeploy], true);

        expect(await masterAccess.hasDeterministicFactoryDeployPermission(USER1)).to.be.false;

        await masterAccess.grantRoles(USER1, [DeterministicFactoryRole]);

        expect(await masterAccess.hasDeterministicFactoryDeployPermission(USER1)).to.be.true;
      });
    });
  });

  describe("addCombinedPermissionsToRole", () => {
    it("should emit AddedRoleWithDescription event", async () => {
      const description = "Allows dropping requests";

      await expect(
        masterAccess.addCombinedPermissionsToRole(ReviewableRequestsRole, description, [ReviewableRequestsDelete], []),
      )
        .to.emit(masterAccess, "AddedPermissions")
        .to.emit(masterAccess, "AddedRoleWithDescription")
        .withArgs(ReviewableRequestsRole, description);

      expect(await masterAccess.hasReviewableRequestsDeletePermission(USER1)).to.be.false;

      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      expect(await masterAccess.hasReviewableRequestsDeletePermission(USER1)).to.be.true;
    });

    it("should add both permissions", async () => {
      const description = "Disallows dropping requests";

      await expect(
        masterAccess.addCombinedPermissionsToRole(
          ReviewableRequestsRole,
          description,
          [ReviewableRequestsDelete],
          [ReviewableRequestsDelete],
        ),
      )
        .to.emit(masterAccess, "AddedPermissions")
        .to.emit(masterAccess, "AddedRoleWithDescription")
        .withArgs(ReviewableRequestsRole, description);

      expect(await masterAccess.hasReviewableRequestsDeletePermission(USER1)).to.be.false;

      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      expect(await masterAccess.hasReviewableRequestsDeletePermission(USER1)).to.be.false;
    });
  });

  describe("removeCombinedPermissionsFromRole", () => {
    it("should remove both roles", async () => {
      await masterAccess.addCombinedPermissionsToRole(
        ReviewableRequestsRole,
        "Disallows dropping requests",
        [ReviewableRequestsDelete],
        [ReviewableRequestsDelete],
      );

      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      expect(await masterAccess.hasReviewableRequestsDeletePermission(USER1));

      await masterAccess.removeCombinedPermissionsFromRole(ReviewableRequestsRole, [], [ReviewableRequestsDelete]);

      expect(await masterAccess.hasReviewableRequestsDeletePermission(USER1)).to.be.true;

      await masterAccess.removeCombinedPermissionsFromRole(ReviewableRequestsRole, [ReviewableRequestsDelete], []);

      expect(await masterAccess.hasReviewableRequestsDeletePermission(USER1));
    });
  });

  describe("updateRolePermissions", () => {
    it("should update the role", async () => {
      await masterAccess.addCombinedPermissionsToRole(
        ReviewableRequestsRole,
        "Disallows dropping requests",
        [ReviewableRequestsDelete],
        [ReviewableRequestsDelete],
      );

      await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

      const description = "Updated description";

      await expect(
        masterAccess.updateRolePermissions(
          ReviewableRequestsRole,
          description,
          [],
          [ReviewableRequestsDelete],
          [ConstantsRegistryCreate],
          [],
        ),
      )
        .to.emit(masterAccess, "RemovedPermissions")
        .to.emit(masterAccess, "AddedPermissions")
        .to.emit(masterAccess, "AddedRoleWithDescription")
        .withArgs(ReviewableRequestsRole, description);

      expect(await masterAccess.hasReviewableRequestsDeletePermission(USER1)).to.be.true;
      expect(await masterAccess.hasConstantsRegistryCreatePermission(USER1)).to.be.true;
    });
  });

  describe("updateUserRoles", () => {
    it("should update user roles", async () => {
      await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryCreate], true);
      await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);

      await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

      expect(await masterAccess.hasMasterContractsRegistryCreatePermission(USER1)).to.be.true;

      await masterAccess.updateUserRoles(USER1, [MasterContractsRegistryRole], [ConstantsRegistryRole]);

      expect(await masterAccess.hasMasterContractsRegistryCreatePermission(USER1)).to.be.false;
      expect(await masterAccess.hasConstantsRegistryCreatePermission(USER1)).to.be.true;
    });
  });
});
