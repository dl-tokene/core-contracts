const { accounts } = require("../../scripts/utils/utils");
const { CREATE_PERMISSION, DELETE_PERMISSION, CONSTANTS_REGISTRY_RESOURCE } = require("../utils/constants");

const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { ETHER_ADDR, ZERO_ADDR, ZERO_BYTES32 } = require("../../scripts/utils/constants");

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
      await truffleAssert.reverts(constantsRegistry.setDependencies(OWNER, "0x"), "Dependant: not an injector");
    });
  });

  describe("#addBytes", () => {
    const key = "Test";
    const randomBytes = "0xab56545242342000aa";

    it("should not be possible to add a bytes constant without the Create permission", async () => {
      await truffleAssert.reverts(
        constantsRegistry.addBytes(key, randomBytes, { from: USER1 }),
        "ConstantsRegistry: access denied"
      );
    });

    context("if the Create role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to add a bytes constant with the Create permission", async () => {
        const tx = await constantsRegistry.addBytes(key, randomBytes, { from: USER1 });
        truffleAssert.eventEmitted(tx.receipt, "AddedBytes");

        assert.equal(await constantsRegistry.getBytes(key), randomBytes);
      });

      it("should not add an empty bytes constant", async () => {
        await truffleAssert.reverts(
          constantsRegistry.addBytes(key, "0x", { from: USER1 }),
          "ConstantsRegistry: empty value"
        );
      });
    });
  });

  describe("#addString", () => {
    const key = "Test";
    const randomString = "mocked long long long long long long long long long long string";

    it("should not be possible to add a string constant without the Create permission", async () => {
      await truffleAssert.reverts(
        constantsRegistry.addString(key, randomString, { from: USER1 }),
        "ConstantsRegistry: access denied"
      );
    });

    context("if the Create role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to add a random string constant", async () => {
        const tx = await constantsRegistry.addString(key, randomString, { from: USER1 });
        truffleAssert.eventEmitted(tx.receipt, "AddedString");

        assert.equal(await constantsRegistry.getString(key), randomString);
      });

      it("should be possible to add an empty string constant", async () => {
        const tx = await constantsRegistry.addString(key, "", { from: USER1 });
        truffleAssert.eventEmitted(tx.receipt, "AddedString");

        assert.equal(await constantsRegistry.getString(key), "");
      });
    });
  });

  describe("#addUint256", () => {
    const key = "Test";
    const randomInteger = 1337;

    it("should not be possible to add an integer constant without the Create permission", async () => {
      await truffleAssert.reverts(
        constantsRegistry.addUint256(key, randomInteger, { from: USER1 }),
        "ConstantsRegistry: access denied"
      );
    });

    context("if the Create role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to add a random integer constant", async () => {
        const tx = await constantsRegistry.addUint256(key, randomInteger, { from: USER1 });
        truffleAssert.eventEmitted(tx.receipt, "AddedUint256");

        assert.equal((await constantsRegistry.getUint256(key)).toNumber(), randomInteger);
      });

      it("should be possible to add a zero integer constant", async () => {
        const tx = await constantsRegistry.addUint256(key, 0, { from: USER1 });
        truffleAssert.eventEmitted(tx.receipt, "AddedUint256");

        assert.equal((await constantsRegistry.getUint256(key)).toNumber(), 0);
      });
    });
  });

  describe("#addAddress", () => {
    const key = "Test";
    const randomAddress = ETHER_ADDR;

    it("should not be possible to add an address constant without the Create permission", async () => {
      await truffleAssert.reverts(
        constantsRegistry.addAddress(key, randomAddress, { from: USER1 }),
        "ConstantsRegistry: access denied"
      );
    });

    context("if the Create role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to add a random address constant", async () => {
        const tx = await constantsRegistry.addAddress(key, randomAddress, { from: USER1 });
        truffleAssert.eventEmitted(tx.receipt, "AddedAddress");

        assert.equal(await constantsRegistry.getAddress(key), randomAddress);
      });

      it("should be possible to add a zero address constant", async () => {
        const tx = await constantsRegistry.addAddress(key, ZERO_ADDR, { from: USER1 });
        truffleAssert.eventEmitted(tx.receipt, "AddedAddress");

        assert.equal(await constantsRegistry.getAddress(key), ZERO_ADDR);
      });
    });
  });

  describe("#addBytes32", () => {
    const key = "Test";
    const randomBytes32 = ZERO_BYTES32.replaceAll("0000", "1234");

    it("should not be possible to add a bytes32 constant without the Create permission", async () => {
      await truffleAssert.reverts(
        constantsRegistry.addBytes32(key, randomBytes32, { from: USER1 }),
        "ConstantsRegistry: access denied"
      );
    });

    context("if the Create role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to add a random bytes32 constant", async () => {
        const tx = await constantsRegistry.addBytes32(key, randomBytes32, { from: USER1 });
        truffleAssert.eventEmitted(tx.receipt, "AddedBytes32");

        assert.equal(await constantsRegistry.getBytes32(key), randomBytes32);
      });

      it("should be possible to add a zero bytes32 address constant", async () => {
        const tx = await constantsRegistry.addBytes32(key, ZERO_BYTES32, { from: USER1 });
        truffleAssert.eventEmitted(tx.receipt, "AddedBytes32");

        assert.equal(await constantsRegistry.getBytes32(key), ZERO_BYTES32);
      });
    });
  });

  describe("#remove", () => {
    const key = "Test";
    const randomBytes = "0xab56545242342000aa";

    it("should not be possible to remove a constant without the Delete permission", async () => {
      await constantsRegistry.addBytes(key, randomBytes);

      assert.equal(await constantsRegistry.getBytes(key), randomBytes);

      await truffleAssert.reverts(constantsRegistry.remove(key, { from: USER1 }), "ConstantsRegistry: access denied");

      assert.equal(await constantsRegistry.getBytes(key), randomBytes);
    });

    context("if the Delete role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryDelete], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to remove a constant", async () => {
        await constantsRegistry.addBytes(key, randomBytes);

        assert.equal(await constantsRegistry.getBytes(key), randomBytes);

        const tx = await constantsRegistry.remove(key, { from: USER1 });
        truffleAssert.eventEmitted(tx.receipt, "Removed");

        assert.isNull(await constantsRegistry.getBytes(key));
      });

      it("should not be possible to remove a nonexistent constant", async () => {
        await truffleAssert.reverts(
          constantsRegistry.remove(key, { from: USER1 }),
          "ConstantsRegistry: constant does not exist"
        );
      });
    });
  });

  describe("#get", () => {
    const key = "Test";

    it("should not be possible to get typed constants if they are not added", async () => {
      assert.isNull(await constantsRegistry.getBytes(key));

      await truffleAssert.reverts(constantsRegistry.getString(key));
      await truffleAssert.reverts(constantsRegistry.getUint256(key));
      await truffleAssert.reverts(constantsRegistry.getAddress(key));
      await truffleAssert.reverts(constantsRegistry.getBytes32(key));
    });
  });
});
