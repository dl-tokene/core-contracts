const { accounts } = require("../../scripts/helpers/utils");

const Reverter = require("../helpers/reverter");
const { artifacts } = require("hardhat");
const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");

const MasterAccessManagement = artifacts.require("MasterAccessManagement");
const ConstantsRegistry = artifacts.require("ConstantsRegistry");
const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");

describe("ConstantsRegistry", () => {
  const reverter = new Reverter();

  let OWNER;
  let USER1;

  const CONSTANTS_REGISTRY_RESOURCE = "CONSTANTS_REGISTRY_RESOURCE";

  const ConstRCreateRole = "CRCreate";
  const ConstRDeleteRole = "CRDelete";

  const CREATE_PERMISSION = "CREATE";
  const DELETE_PERMISSION = "DELETE";

  const ConstRCreate = [CONSTANTS_REGISTRY_RESOURCE, [CREATE_PERMISSION]];

  const ConstRDelete = [CONSTANTS_REGISTRY_RESOURCE, [DELETE_PERMISSION]];

  let constantsRegistry;
  let masterAccess;
  let registry;

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);

    const _masterAccess = await MasterAccessManagement.new();

    registry = await MasterContractsRegistry.new();
    await registry.__MasterContractsRegistry_init(_masterAccess.address);

    masterAccess = await MasterAccessManagement.at(
      await registry.getContract(await registry.MASTER_ACCESS_MANAGEMENT_NAME())
    );
    await masterAccess.__MasterAccessManagement_init(OWNER);

    const _constantsRegistry = await ConstantsRegistry.new();
    await registry.addProxyContract(await registry.CONSTANTS_REGISTRY_NAME(), _constantsRegistry.address);

    constantsRegistry = await ConstantsRegistry.at(
      await registry.getContract(await registry.CONSTANTS_REGISTRY_NAME())
    );
    await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("addConstant", () => {
    it("should be possible to addConstant with Create permission", async () => {
      await masterAccess.addPermissionsToRole(ConstRCreateRole, [ConstRCreate], true);
      await masterAccess.grantRoles(USER1, [ConstRCreateRole]);

      const key = "Test";
      const randomBytes = "0xab56545242342000aa";
      await constantsRegistry.addConstant(key, randomBytes, { from: USER1 });

      assert.equal(await constantsRegistry.constants(key), randomBytes);
    });

    it("should not be possible to addConstant without Create permission", async () => {
      const key = "Test";
      const randomBytes = "0xab56545242342000aa";
      await truffleAssert.reverts(
        constantsRegistry.addConstant(key, randomBytes, { from: USER1 }),
        "ConstantsRegistry: access denied"
      );
    });
  });

  describe("removeConstant", () => {
    it("should be possible to removeConstant with Delete permission", async () => {
      await masterAccess.addPermissionsToRole(ConstRDeleteRole, [ConstRDelete], true);
      await masterAccess.grantRoles(USER1, [ConstRDeleteRole]);

      const key = "Test";
      const randomBytes = "0xab56545242342000aa";

      await constantsRegistry.addConstant(key, randomBytes);
      assert.equal(await constantsRegistry.constants(key), randomBytes);

      await constantsRegistry.removeConstant(key, { from: USER1 });

      assert.equal(await constantsRegistry.constants(key), null);
    });

    it("should not be possible to removeConstant without Delete permission", async () => {
      const key = "Test";
      const randomBytes = "0xab56545242342000aa";

      await constantsRegistry.addConstant(key, randomBytes);
      assert.equal(await constantsRegistry.constants(key), randomBytes);

      await truffleAssert.reverts(
        constantsRegistry.removeConstant(key, { from: USER1 }),
        "ConstantsRegistry: access denied"
      );

      assert.equal(await constantsRegistry.constants(key), randomBytes);
    });
  });
});
