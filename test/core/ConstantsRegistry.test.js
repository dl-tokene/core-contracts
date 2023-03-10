const { accounts } = require("../../scripts/utils/utils");
const { CREATE_PERMISSION, DELETE_PERMISSION, CONSTANTS_REGISTRY_RESOURCE } = require("../utils/constants");

const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");

const MasterAccessManagement = artifacts.require("MasterAccessManagement");
const ConstantsRegistry = artifacts.require("ConstantsRegistry");
const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");

describe("ConstantsRegistry", () => {
  const reverter = new Reverter();

  let OWNER;
  let USER1;

  const ConstantsRegistryRole = "CR";

  const ConstantsRegistryCreate = [CONSTANTS_REGISTRY_RESOURCE, [CREATE_PERMISSION]];
  const ConstantsRegistryDelete = [CONSTANTS_REGISTRY_RESOURCE, [DELETE_PERMISSION]];

  let constantsRegistry;
  let masterAccess;
  let registry;

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);

    registry = await MasterContractsRegistry.new();
    const _masterAccess = await MasterAccessManagement.new();
    const _constantsRegistry = await ConstantsRegistry.new();

    await registry.__MasterContractsRegistry_init(_masterAccess.address);

    masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(await registry.CONSTANTS_REGISTRY_NAME(), _constantsRegistry.address);

    constantsRegistry = await ConstantsRegistry.at(await registry.getConstantsRegistry());

    await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("basic access", () => {
    it("should not set dependencies from non dependant", async () => {
      await truffleAssert.reverts(constantsRegistry.setDependencies(OWNER), "Dependant: Not an injector");
    });
  });

  describe("addConstant", () => {
    it("should be possible to addConstant with Create permission", async () => {
      await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
      await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);

      const key = "Test";
      const randomBytes = "0xab56545242342000aa";

      await constantsRegistry.addConstant(key, randomBytes, { from: USER1 });

      assert.equal(await constantsRegistry.constants(key), randomBytes);
    });

    it("should not add an empty constant", async () => {
      await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
      await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);

      const key = "Test";

      await truffleAssert.reverts(
        constantsRegistry.addConstant(key, "0x", { from: USER1 }),
        "ConstantsRegistry: empty value"
      );
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
      await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryDelete], true);
      await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);

      const key = "Test";
      const randomBytes = "0xab56545242342000aa";

      await constantsRegistry.addConstant(key, randomBytes);

      assert.equal(await constantsRegistry.constants(key), randomBytes);

      await constantsRegistry.removeConstant(key, { from: USER1 });

      assert.equal(await constantsRegistry.constants(key), null);
    });

    it("should not remove nonexisting constant", async () => {
      await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryDelete], true);
      await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);

      const key = "Test";

      await truffleAssert.reverts(
        constantsRegistry.removeConstant(key, { from: USER1 }),
        "ConstantsRegistry: constant does not exist"
      );
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
