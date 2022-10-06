const { accounts } = require("../scripts/helpers/utils");

const Reverter = require("./helpers/reverter");
const { artifacts } = require("hardhat");
const truffleAssert = require("truffle-assertions");
const { assert, use } = require("chai");

const MasterAccessManagement = artifacts.require("MasterAccessManagement");
const ConstantsRegistry = artifacts.require("ConstantsRegistry");
const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");

describe("MasterContractsRegistry", async () => {
  const reverter = new Reverter();

  let OWNER;
  let USER1;

  let registry;
  let masterAccess;
  let constantsRegistry;

  const MASTER_REGISTRY_RESOURCE = "MASTER_REGISTRY_RESOURCE";

  const CREATE_PERMISSION = "CREATE";
  const UPDATE_PERMISSION = "UPDATE";
  const DELETE_PERMISSION = "DELETE";

  const MCRCreateRole = "MCRCreate";
  const MCRUpdateRole = "MCRUpdate";
  const MCRDeleteRole = "MCRDelete";

  const MCRCreate = [MASTER_REGISTRY_RESOURCE, [CREATE_PERMISSION]];

  const MCRUpdate = [MASTER_REGISTRY_RESOURCE, [UPDATE_PERMISSION]];

  const MCRDelete = [MASTER_REGISTRY_RESOURCE, [DELETE_PERMISSION]];

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);

    const _masterAccess = await MasterAccessManagement.new();

    registry = await MasterContractsRegistry.new();
    const registryProxy = await ERC1967Proxy.new(registry.address, []);
    registry = await MasterContractsRegistry.at(registryProxy.address);
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

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("test access to all basic functions", () => {
    it("should be possible to call injectDependencies with Create permission", async () => {
      await masterAccess.addPermissionsToRole(MCRCreateRole, [MCRCreate], true);
      await masterAccess.grantRoles(USER1, [MCRCreateRole]);

      await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME(), { from: USER1 });
    });
    it("should not be possible to call injectDependencies without Create permission", async () => {
      await truffleAssert.reverts(
        registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME(), { from: USER1 }),
        "RoleManagedRegistry: access denied"
      );
    });

    it("should be possible to call upgradeContract with Update permission", async () => {
      await masterAccess.addPermissionsToRole(MCRUpdateRole, [MCRUpdate], true);
      await masterAccess.grantRoles(USER1, [MCRUpdateRole]);

      await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME({ from: OWNER }));

      const _constantsRegistry = await ConstantsRegistry.new();
      await registry.upgradeContract(await registry.CONSTANTS_REGISTRY_NAME(), _constantsRegistry.address, {
        from: USER1,
      });
    });
    it("should not be possible to call upgradeContract without Update permission", async () => {
      await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME({ from: OWNER }));

      const _constantsRegistry = await ConstantsRegistry.new();
      await truffleAssert.reverts(
        registry.upgradeContract(await registry.CONSTANTS_REGISTRY_NAME(), _constantsRegistry.address, { from: USER1 }),
        "RoleManagedRegistry: access denied"
      );
    });

    it("should be possible to call upgradeContractAndCall with Update permission", async () => {
      await masterAccess.addPermissionsToRole(MCRUpdateRole, [MCRUpdate], true);
      await masterAccess.grantRoles(USER1, [MCRUpdateRole]);

      const _constantsRegistry = await ConstantsRegistry.new();
      await registry.upgradeContractAndCall(
        await registry.CONSTANTS_REGISTRY_NAME(),
        _constantsRegistry.address,
        "0x",
        { from: USER1 }
      );
    });
    it("should not be possible to call upgradeContractAndCall without Update permission", async () => {
      const _constantsRegistry = await ConstantsRegistry.new();
      await truffleAssert.reverts(
        registry.upgradeContractAndCall(await registry.CONSTANTS_REGISTRY_NAME(), _constantsRegistry.address, "0x", {
          from: USER1,
        }),
        "RoleManagedRegistry: access denied"
      );
    });

    it("should be possible to call addContract with Create permission", async () => {
      await masterAccess.addPermissionsToRole(MCRCreateRole, [MCRCreate], true);
      await masterAccess.grantRoles(USER1, [MCRCreateRole]);

      const _constantsRegistry = await ConstantsRegistry.new();
      await registry.addContract("TEST", _constantsRegistry.address, { from: USER1 });
    });
    it("should not be possible to call addContract without Create permission", async () => {
      const _constantsRegistry = await ConstantsRegistry.new();
      await truffleAssert.reverts(
        registry.addContract("TEST", _constantsRegistry.address, { from: USER1 }),
        "RoleManagedRegistry: access denied"
      );
    });

    it("should be possible to call addProxyContract with Create permission", async () => {
      await masterAccess.addPermissionsToRole(MCRCreateRole, [MCRCreate], true);
      await masterAccess.grantRoles(USER1, [MCRCreateRole]);

      const _constantsRegistry = await ConstantsRegistry.new();
      await registry.addProxyContract("TEST", _constantsRegistry.address, { from: USER1 });
    });
    it("should not be possible to call addProxyContract without Create permission", async () => {
      const _constantsRegistry = await ConstantsRegistry.new();
      await truffleAssert.reverts(
        registry.addProxyContract("TEST", _constantsRegistry.address, { from: USER1 }),
        "RoleManagedRegistry: access denied"
      );
    });

    it("should be possible to call justAddProxyContract with Create permission", async () => {
      await masterAccess.addPermissionsToRole(MCRCreateRole, [MCRCreate], true);
      await masterAccess.grantRoles(USER1, [MCRCreateRole]);

      const _constantsRegistry = await ConstantsRegistry.new();
      await registry.justAddProxyContract("TEST", _constantsRegistry.address, { from: USER1 });
    });
    it("should not be possible to call justAddProxyContract without Create permission", async () => {
      const _constantsRegistry = await ConstantsRegistry.new();
      await truffleAssert.reverts(
        registry.justAddProxyContract("TEST", _constantsRegistry.address, { from: USER1 }),
        "RoleManagedRegistry: access denied"
      );
    });

    it("should be possible to call removeContract with Delete permission", async () => {
      await masterAccess.addPermissionsToRole(MCRDeleteRole, [MCRDelete], true);
      await masterAccess.grantRoles(USER1, [MCRDeleteRole]);

      const _constantsRegistry = await ConstantsRegistry.new();
      await registry.justAddProxyContract("TEST", _constantsRegistry.address);

      await registry.removeContract("TEST", { from: USER1 });
    });
    it("should not be possible to call removeContract without Delete permission", async () => {
      const _constantsRegistry = await ConstantsRegistry.new();
      await registry.justAddProxyContract("TEST", _constantsRegistry.address);

      await truffleAssert.reverts(
        registry.removeContract("TEST", { from: USER1 }),
        "RoleManagedRegistry: access denied"
      );
    });

    it("should be possible to upgrade UUPS proxy with Create permission", async () => {
      await masterAccess.addPermissionsToRole(MCRCreateRole, [MCRCreate], true);
      await masterAccess.grantRoles(USER1, [MCRCreateRole]);

      const _registry = await MasterContractsRegistry.new();
      await registry.upgradeTo(_registry.address, { from: USER1 });
    });

    it("should not be possible to upgrade UUPS proxy without Create permission", async () => {
      const _registry = await MasterContractsRegistry.new();
      await truffleAssert.reverts(
        registry.upgradeTo(_registry.address, { from: USER1 }),
        "RoleManagedRegistry: access denied"
      );
    });
  });

  describe("getters", () => {
    it("should correctly return masterAccess contract with getMasterAccessManagement", async () => {
      assert.equal(await registry.getMasterAccessManagement(), masterAccess.address);
    });

    it("should correctly return constantsRegistry contract with getConstantsRegistry", async () => {
      assert.equal(await registry.getConstantsRegistry(), constantsRegistry.address);
    });
  });
});
