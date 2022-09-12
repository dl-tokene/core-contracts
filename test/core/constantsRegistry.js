const { accounts } = require("../../scripts/helpers/utils");

const Reverter = require("../helpers/reverter");
const { artifacts } = require("hardhat");
const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");

const MasterRoleManagement = artifacts.require("MasterRoleManagement");
const ConstantsRegistry = artifacts.require("ConstantsRegistry");
const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");

describe("TokenFactory", async () => {
  const reverter = new Reverter();

  const MASTER_REGISTRY_ADMIN_ROLE = "0xbe3b6931ad58d884ac8399c59bbbed7c5fe116d99ea3833c92a2d6987cefec5d";
  const CONSTANTS_REGISTRY_ADMIN_ROLE = "0xb70679c2bb63d69954ff974d88551a7613146cf648202f5d0bc5ecdad424d359";

  let OWNER;
  let USER1;
  let USER2;
  let USER3;

  let constantsRegistry;
  let masterRoles;
  let registry;

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);
    USER2 = await accounts(2);
    USER3 = await accounts(3);

    const _masterRoles = await MasterRoleManagement.new();

    registry = await MasterContractsRegistry.new();
    await registry.__MasterContractsRegistry_init(_masterRoles.address);

    masterRoles = await MasterRoleManagement.at(
      await registry.getContract(await registry.MASTER_ROLE_MANAGEMENT_NAME())
    );
    await masterRoles.__MasterRoleManagement_init();
    await masterRoles.grantRole(MASTER_REGISTRY_ADMIN_ROLE, OWNER);

    const _constantsRegistry = await ConstantsRegistry.new();
    await registry.addProxyContract(await registry.CONSTANTS_REGISTRY_NAME(), _constantsRegistry.address);

    constantsRegistry = await ConstantsRegistry.at(
      await registry.getContract(await registry.CONSTANTS_REGISTRY_NAME())
    );
    await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME());

    await masterRoles.grantRole(CONSTANTS_REGISTRY_ADMIN_ROLE, USER2);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("addConstant", async () => {
    it("should be possible to addContant from the CONSTANTS_REGISTRY_ADMIN_ROLE address", async () => {
      const key = "Test";
      const randomBytes = "0xab56545242342000aa";
      await constantsRegistry.addConstant(key, randomBytes, { from: USER2 });

      assert.equal(await constantsRegistry.constants(key), randomBytes);
    });

    it("should not be possible to addContant not from the CONSTANTS_REGISTRY_ADMIN_ROLE role", async () => {
      const key = "Test";
      const randomBytes = "0xab56545242342000aa";
      await truffleAssert.reverts(
        constantsRegistry.addConstant(key, randomBytes, { from: USER1 }),
        "ConstantsRegistry: not a CONSTANTS_REGISTRY_ADMIN"
      );
    });
  });

  describe("removeConstant", async () => {
    it("should be possible to removeConstant from the CONSTANTS_REGISTRY_ADMIN_ROLE address", async () => {
      const key = "Test";
      const randomBytes = "0xab56545242342000aa";

      await constantsRegistry.addConstant(key, randomBytes, { from: USER2 });
      assert.equal(await constantsRegistry.constants(key), randomBytes);

      await constantsRegistry.removeConstant(key, { from: USER2 });

      assert.equal(await constantsRegistry.constants(key), null);
    });

    it("should not be possible to removeConstant not from the CONSTANTS_REGISTRY_ADMIN_ROLE role", async () => {
      const key = "Test";
      const randomBytes = "0xab56545242342000aa";

      await constantsRegistry.addConstant(key, randomBytes, { from: USER2 });
      assert.equal(await constantsRegistry.constants(key), randomBytes);

      await truffleAssert.reverts(
        constantsRegistry.removeConstant(key, { from: USER1 }),
        "ConstantsRegistry: not a CONSTANTS_REGISTRY_ADMIN"
      );

      assert.equal(await constantsRegistry.constants(key), randomBytes);
    });
  });
});
