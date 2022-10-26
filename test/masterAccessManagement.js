const { accounts } = require("../scripts/utils/utils");
const {
  CREATE_PERMISSION,
  UPDATE_PERMISSION,
  DELETE_PERMISSION,
  EXECUTE_PERMISSION,
  MASTER_REGISTRY_RESOURCE,
  CONSTANTS_REGISTRY_RESOURCE,
  REVIEWABLE_REQUESTS_RESOURCE,
} = require("./utils/constants");

const Reverter = require("./helpers/reverter");
const truffleAssert = require("truffle-assertions");

const MasterAccessManagement = artifacts.require("MasterAccessManagement");

describe("MasterAccessManagement", async () => {
  const reverter = new Reverter();

  let OWNER;
  let USER1;

  let masterAccess;

  const MasterContractsRegistryRole = "MCR";
  const ConstantsRegistryRole = "CR";
  const ReviewableRequestsRole = "RR";

  const MasterContractsRegistryCreate = [MASTER_REGISTRY_RESOURCE, [CREATE_PERMISSION]];
  const MasterContractsRegistryUpdate = [MASTER_REGISTRY_RESOURCE, [UPDATE_PERMISSION]];
  const MasterContractsRegistryDelete = [MASTER_REGISTRY_RESOURCE, [DELETE_PERMISSION]];

  const ConstantsRegistryCreate = [CONSTANTS_REGISTRY_RESOURCE, [CREATE_PERMISSION]];
  const ConstantsRegistryDelete = [CONSTANTS_REGISTRY_RESOURCE, [DELETE_PERMISSION]];

  const ReviewableRequestsCreate = [REVIEWABLE_REQUESTS_RESOURCE, [CREATE_PERMISSION]];
  const ReviewableRequestsUpdate = [REVIEWABLE_REQUESTS_RESOURCE, [UPDATE_PERMISSION]];
  const ReviewableRequestsExecute = [REVIEWABLE_REQUESTS_RESOURCE, [EXECUTE_PERMISSION]];
  const ReviewableRequestsDelete = [REVIEWABLE_REQUESTS_RESOURCE, [DELETE_PERMISSION]];

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);

    masterAccess = await MasterAccessManagement.new();

    await masterAccess.__MasterAccessManagement_init(OWNER);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("basic access", () => {
    it("should not initialize twice", async () => {
      await truffleAssert.reverts(
        masterAccess.__MasterAccessManagement_init(OWNER),
        "Initializable: contract is already initialized"
      );
    });
  });

  describe("getters", () => {
    describe("MasterContractsRegistry", () => {
      it("should correctly check access for hasMasterContractsRegistryCreatePermission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryCreate], true);

        await assert.isFalse(await masterAccess.hasMasterContractsRegistryCreatePermission(USER1));

        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        await assert.isTrue(await masterAccess.hasMasterContractsRegistryCreatePermission(USER1));
      });

      it("should correctly check access for hasMasterContractsRegistryUpdatePermission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryUpdate], true);

        await assert.isFalse(await masterAccess.hasMasterContractsRegistryUpdatePermission(USER1));

        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        await assert.isTrue(await masterAccess.hasMasterContractsRegistryUpdatePermission(USER1));
      });

      it("should correctly check access for hasMasterContractsRegistryDeletePermission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryDelete], true);

        await assert.isFalse(await masterAccess.hasMasterContractsRegistryDeletePermission(USER1));

        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        await assert.isTrue(await masterAccess.hasMasterContractsRegistryDeletePermission(USER1));
      });
    });

    describe("ConstantsRegistry", () => {
      it("should correctly check access for hasConstantsRegistryCreatePermission", async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);

        await assert.isFalse(await masterAccess.hasConstantsRegistryCreatePermission(USER1));

        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);

        await assert.isTrue(await masterAccess.hasConstantsRegistryCreatePermission(USER1));
      });

      it("should correctly check access for hasConstantsRegistryDeletePermission", async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryDelete], true);

        await assert.isFalse(await masterAccess.hasConstantsRegistryDeletePermission(USER1));

        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);

        await assert.isTrue(await masterAccess.hasConstantsRegistryDeletePermission(USER1));
      });
    });

    describe("ReviewableRequests", () => {
      it("should correctly check access for hasReviewableRequestsCreatePermission", async () => {
        await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsCreate], true);

        await assert.isFalse(await masterAccess.hasReviewableRequestsCreatePermission(USER1));

        await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

        await assert.isTrue(await masterAccess.hasReviewableRequestsCreatePermission(USER1));
      });

      it("should correctly check access for hasReviewableRequestsExecutePermission", async () => {
        await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsExecute], true);

        await assert.isFalse(await masterAccess.hasReviewableRequestsExecutePermission(USER1));

        await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

        await assert.isTrue(await masterAccess.hasReviewableRequestsExecutePermission(USER1));
      });

      it("should correctly check access for hasReviewableRequestsDeletePermission", async () => {
        await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsDelete], true);

        await assert.isFalse(await masterAccess.hasReviewableRequestsDeletePermission(USER1));

        await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

        await assert.isTrue(await masterAccess.hasReviewableRequestsDeletePermission(USER1));
      });
    });
  });
});
