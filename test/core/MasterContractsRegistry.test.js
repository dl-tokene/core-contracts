const { accounts } = require("../../scripts/utils/utils");
const {
  CREATE_PERMISSION,
  UPDATE_PERMISSION,
  DELETE_PERMISSION,
  MASTER_REGISTRY_RESOURCE,
} = require("../utils/constants");

const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const RoleManagedRegistryMock = artifacts.require("RoleManagedRegistryMock");

const MasterAccessManagement = artifacts.require("MasterAccessManagement");
const ConstantsRegistry = artifacts.require("ConstantsRegistry");
const ReviewableRequests = artifacts.require("ReviewableRequests");
const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");

describe("MasterContractsRegistry", async () => {
  const reverter = new Reverter();

  let OWNER;
  let USER1;

  let _constantsRegistry;
  let registry;
  let masterAccess;

  const MasterContractsRegistryRole = "MCR";

  const MasterContractsRegistryCreate = [MASTER_REGISTRY_RESOURCE, [CREATE_PERMISSION]];
  const MasterContractsRegistryUpdate = [MASTER_REGISTRY_RESOURCE, [UPDATE_PERMISSION]];
  const MasterContractsRegistryDelete = [MASTER_REGISTRY_RESOURCE, [DELETE_PERMISSION]];

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);

    const _registry = await MasterContractsRegistry.new();
    const _masterAccess = await MasterAccessManagement.new();
    _constantsRegistry = await ConstantsRegistry.new();
    const _reviewableRequests = await ReviewableRequests.new();
    const registryProxy = await ERC1967Proxy.new(_registry.address, []);

    registry = await MasterContractsRegistry.at(registryProxy.address);

    await registry.__MasterContractsRegistry_init(_masterAccess.address);

    masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(await registry.CONSTANTS_REGISTRY_NAME(), _constantsRegistry.address);
    await registry.addProxyContract(await registry.REVIEWABLE_REQUESTS_NAME(), _reviewableRequests.address);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("constructor", () => {
    it("should emit Initialized event", async () => {
      const _registry = await MasterContractsRegistry.new();
      const registryProxy = await ERC1967Proxy.new(_registry.address, []);
      const newRegistry = await MasterContractsRegistry.at(registryProxy.address);
      const _masterAccess = await MasterAccessManagement.new();

      let tx = await newRegistry.__MasterContractsRegistry_init(_masterAccess.address);

      assert.equal(tx.logs[3].event, "Initialized");
    });
  });

  describe("basic access", () => {
    it("should not initialize twice", async () => {
      const roleManagedRegistryMock = await RoleManagedRegistryMock.new();

      await truffleAssert.reverts(
        registry.__MasterContractsRegistry_init(OWNER),
        "Initializable: contract is already initialized"
      );

      await truffleAssert.reverts(roleManagedRegistryMock.init(OWNER), "Initializable: contract is not initializing");
    });
  });

  describe("permissions access", () => {
    describe("injectDependencies", () => {
      it("should be possible to call injectDependencies with Create permission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME(), { from: USER1 });
      });

      it("should not be possible to call injectDependencies without Create permission", async () => {
        await truffleAssert.reverts(
          registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME(), { from: USER1 }),
          "MasterContractsRegistry: access denied"
        );
      });
    });

    describe("upgradeContract", () => {
      it("should be possible to call upgradeContract with Update permission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryUpdate], true);
        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        await registry.upgradeContract(await registry.CONSTANTS_REGISTRY_NAME(), _constantsRegistry.address, {
          from: USER1,
        });
      });

      it("should not be possible to call upgradeContract without Update permission", async () => {
        await truffleAssert.reverts(
          registry.upgradeContract(await registry.CONSTANTS_REGISTRY_NAME(), _constantsRegistry.address, {
            from: USER1,
          }),
          "MasterContractsRegistry: access denied"
        );
      });
    });

    describe("upgradeContractAndCall", () => {
      it("should be possible to call upgradeContractAndCall with Update permission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryUpdate], true);
        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        await registry.upgradeContractAndCall(
          await registry.CONSTANTS_REGISTRY_NAME(),
          _constantsRegistry.address,
          "0x",
          { from: USER1 }
        );
      });

      it("should not be possible to call upgradeContractAndCall without Update permission", async () => {
        await truffleAssert.reverts(
          registry.upgradeContractAndCall(await registry.CONSTANTS_REGISTRY_NAME(), _constantsRegistry.address, "0x", {
            from: USER1,
          }),
          "MasterContractsRegistry: access denied"
        );
      });
    });

    describe("addContract", () => {
      it("should be possible to call addContract with Create permission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        await registry.addContract("TEST", _constantsRegistry.address, { from: USER1 });
      });

      it("should not be possible to call addContract without Create permission", async () => {
        await truffleAssert.reverts(
          registry.addContract("TEST", _constantsRegistry.address, { from: USER1 }),
          "MasterContractsRegistry: access denied"
        );
      });
    });

    describe("addProxyContract", () => {
      it("should be possible to call addProxyContract with Create permission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        await registry.addProxyContract("TEST", _constantsRegistry.address, { from: USER1 });
      });

      it("should not be possible to call addProxyContract without Create permission", async () => {
        await truffleAssert.reverts(
          registry.addProxyContract("TEST", _constantsRegistry.address, { from: USER1 }),
          "MasterContractsRegistry: access denied"
        );
      });
    });

    describe("justAddProxyContract", () => {
      it("should be possible to call justAddProxyContract with Create permission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        await registry.justAddProxyContract("TEST", _constantsRegistry.address, { from: USER1 });
      });

      it("should not be possible to call justAddProxyContract without Create permission", async () => {
        await truffleAssert.reverts(
          registry.justAddProxyContract("TEST", _constantsRegistry.address, { from: USER1 }),
          "MasterContractsRegistry: access denied"
        );
      });
    });

    describe("removeContract", () => {
      it("should be possible to call removeContract with Delete permission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryDelete], true);
        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        await registry.justAddProxyContract("TEST", _constantsRegistry.address);
        await registry.removeContract("TEST", { from: USER1 });
      });

      it("should not be possible to call removeContract without Delete permission", async () => {
        await registry.justAddProxyContract("TEST", _constantsRegistry.address);
        await truffleAssert.reverts(
          registry.removeContract("TEST", { from: USER1 }),
          "MasterContractsRegistry: access denied"
        );
      });
    });

    describe("upgrade UUPS", () => {
      let _registry;

      beforeEach("setup", async () => {
        _registry = await MasterContractsRegistry.new();
      });

      it("should be possible to upgrade UUPS proxy with Create permission", async () => {
        await masterAccess.addPermissionsToRole(MasterContractsRegistryRole, [MasterContractsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [MasterContractsRegistryRole]);

        await registry.upgradeTo(_registry.address, { from: USER1 });
      });

      it("should not be possible to upgrade UUPS proxy without Create permission", async () => {
        await truffleAssert.reverts(
          registry.upgradeTo(_registry.address, { from: USER1 }),
          "MasterContractsRegistry: access denied"
        );
      });
    });
  });

  describe("getters", () => {
    it("should correctly return MasterAccess contract with getMasterAccessManagement", async () => {
      assert.equal(
        await registry.getContract(await registry.MASTER_ACCESS_MANAGEMENT_NAME()),
        await registry.getMasterAccessManagement()
      );
    });

    it("should correctly return ConstantsRegistry contract with getConstantsRegistry", async () => {
      assert.equal(
        await registry.getContract(await registry.CONSTANTS_REGISTRY_NAME()),
        await registry.getConstantsRegistry()
      );
    });

    it("should correctly return ReviewableRequests contract with getReviewableRequests", async () => {
      assert.equal(
        await registry.getContract(await registry.REVIEWABLE_REQUESTS_NAME()),
        await registry.getReviewableRequests()
      );
    });
  });
});
