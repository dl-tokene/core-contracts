const { accounts } = require("../scripts/helpers/utils");

const Reverter = require("./helpers/reverter");
const { artifacts } = require("hardhat");
const { assert } = require("chai");

const MasterAccessManagement = artifacts.require("MasterAccessManagement");

describe("MasterAccessManagement", async () => {
  const reverter = new Reverter();

  let OWNER;
  let USER1;

  let masterAccess;

  const MASTER_REGISTRY_RESOURCE = "MASTER_REGISTRY_RESOURCE";
  const CONSTANTS_REGISTRY_RESOURCE = "CONSTANTS_REGISTRY_RESOURCE";

  const CREATE_PERMISSION = "CREATE";
  const UPDATE_PERMISSION = "UPDATE";
  const DELETE_PERMISSION = "DELETE";

  const MCRCreateRole = "MCRCreate";
  const MCRUpdateRole = "MCRUpdate";
  const MCRDeleteRole = "MCRDelete";
  const ConstRCreateRole = "CRCreate";
  const ConstRDeleteRole = "CRDelete";

  const MCRCreate = [MASTER_REGISTRY_RESOURCE, [CREATE_PERMISSION]];

  const MCRUpdate = [MASTER_REGISTRY_RESOURCE, [UPDATE_PERMISSION]];

  const MCRDelete = [MASTER_REGISTRY_RESOURCE, [DELETE_PERMISSION]];

  const ConstRCreate = [CONSTANTS_REGISTRY_RESOURCE, [CREATE_PERMISSION]];

  const ConstRDelete = [CONSTANTS_REGISTRY_RESOURCE, [DELETE_PERMISSION]];

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);

    masterAccess = await MasterAccessManagement.new();
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("getters", () => {
    it("should correctly check access for hasMasterContractsRegistryCreatePermission", async () => {
      await masterAccess.addPermissionsToRole(MCRCreateRole, [MCRCreate], true);
      await assert.isFalse(await masterAccess.hasMasterContractsRegistryCreatePermission(USER1));
      await masterAccess.grantRoles(USER1, [MCRCreateRole]);
      await assert.isTrue(await masterAccess.hasMasterContractsRegistryCreatePermission(USER1));
    });

    it("should correctly check access for hasMasterContractsRegistryUpdatePermission", async () => {
      await masterAccess.addPermissionsToRole(MCRUpdateRole, [MCRUpdate], true);
      await assert.isFalse(await masterAccess.hasMasterContractsRegistryUpdatePermission(USER1));
      await masterAccess.grantRoles(USER1, [MCRUpdateRole]);
      await assert.isTrue(await masterAccess.hasMasterContractsRegistryUpdatePermission(USER1));
    });

    it("should correctly check access for hasMasterContractsRegistryDeletePermission", async () => {
      await masterAccess.addPermissionsToRole(MCRDeleteRole, [MCRDelete], true);
      await assert.isFalse(await masterAccess.hasMasterContractsRegistryDeletePermission(USER1));
      await masterAccess.grantRoles(USER1, [MCRDeleteRole]);
      await assert.isTrue(await masterAccess.hasMasterContractsRegistryDeletePermission(USER1));
    });

    it("should correctly check access for hasConstantsRegistryCreatePermission", async () => {
      await masterAccess.addPermissionsToRole(ConstRCreateRole, [ConstRCreate], true);
      await assert.isFalse(await masterAccess.hasConstantsRegistryCreatePermission(USER1));
      await masterAccess.grantRoles(USER1, [ConstRCreateRole]);
      await assert.isTrue(await masterAccess.hasConstantsRegistryCreatePermission(USER1));
    });

    it("should correctly check access for hasConstantsRegistryDeletePermission", async () => {
      await masterAccess.addPermissionsToRole(ConstRDeleteRole, [ConstRDelete], true);
      await assert.isFalse(await masterAccess.hasConstantsRegistryDeletePermission(USER1));
      await masterAccess.grantRoles(USER1, [ConstRDeleteRole]);
      await assert.isTrue(await masterAccess.hasConstantsRegistryDeletePermission(USER1));
    });
  });
});
