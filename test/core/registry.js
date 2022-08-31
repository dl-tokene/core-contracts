const { accounts } = require("../../scripts/helpers/utils");

const Reverter = require("../helpers/reverter");
const { artifacts } = require("hardhat");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const MasterRoleManagement = artifacts.require("MasterRoleManagement");
const TokenFactory = artifacts.require("TokenFactoryRequestable");
const Registry = artifacts.require("Registry");

describe("MasterRoleManagement", async () => {
  const reverter = new Reverter();

  const MASTER_REGISTRY_ADMIN_ROLE = "0xbe3b6931ad58d884ac8399c59bbbed7c5fe116d99ea3833c92a2d6987cefec5d";

  let OWNER;
  let USER1;

  let registry;
  let masterRoles;

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);

    const _masterRoles = await MasterRoleManagement.new();

    registry = await Registry.new();
    await registry.__Registry_init(_masterRoles.address);

    masterRoles = await MasterRoleManagement.at(
      await registry.getContract(await registry.MASTER_ROLE_MANAGEMENT_NAME())
    );
    await masterRoles.__initMasterRoleManagement();
    await masterRoles.grantRole(MASTER_REGISTRY_ADMIN_ROLE, OWNER);

    const _tokenFactory = await TokenFactory.new();
    await registry.addProxyContract(await registry.TOKEN_FACTORY_NAME(), _tokenFactory.address);

    tokenFactory = await TokenFactory.at(await registry.getContract(await registry.TOKEN_FACTORY_NAME()));

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("test access to all functions by the role", async () => {
    it("should be possible to call injectDependencies by the admin", async () => {
      await registry.injectDependencies(await registry.TOKEN_FACTORY_NAME());
    });
    it("should not be possible to call injectDependencies not by the admin", async () => {
      await truffleAssert.reverts(
        registry.injectDependencies(await registry.TOKEN_FACTORY_NAME(), { from: USER1 }),
        "RoleManagedRegistry: not a MASTER_ROLE_MANAGEMENT role"
      );
    });

    it("should be possible to call upgradeContract by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await registry.upgradeContract(await registry.TOKEN_FACTORY_NAME(), _tokenFactory.address);
    });
    it("should not be possible to call upgradeContract not by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await truffleAssert.reverts(
        registry.upgradeContract(await registry.TOKEN_FACTORY_NAME(), _tokenFactory.address, { from: USER1 }),
        "RoleManagedRegistry: not a MASTER_ROLE_MANAGEMENT role"
      );
    });

    it("should be possible to call upgradeContractAndCall by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await registry.upgradeContractAndCall(await registry.TOKEN_FACTORY_NAME(), _tokenFactory.address, "0x");
    });
    it("should not be possible to call upgradeContractAndCall not by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await truffleAssert.reverts(
        registry.upgradeContractAndCall(await registry.TOKEN_FACTORY_NAME(), _tokenFactory.address, "0x", {
          from: USER1,
        }),
        "RoleManagedRegistry: not a MASTER_ROLE_MANAGEMENT role"
      );
    });

    it("should be possible to call addContract by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await registry.addContract("TEST", _tokenFactory.address);
    });
    it("should not be possible to call addContract not by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await truffleAssert.reverts(
        registry.addContract("TEST", _tokenFactory.address, { from: USER1 }),
        "RoleManagedRegistry: not a MASTER_ROLE_MANAGEMENT role"
      );
    });

    it("should be possible to call addProxyContract by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await registry.addProxyContract("TEST", _tokenFactory.address);
    });
    it("should not be possible to call addProxyContract not by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await truffleAssert.reverts(
        registry.addProxyContract("TEST", _tokenFactory.address, { from: USER1 }),
        "RoleManagedRegistry: not a MASTER_ROLE_MANAGEMENT role"
      );
    });

    it("should be possible to call justAddProxyContract by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await registry.justAddProxyContract("TEST", _tokenFactory.address);
    });
    it("should not be possible to call justAddProxyContract not by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await truffleAssert.reverts(
        registry.justAddProxyContract("TEST", _tokenFactory.address, { from: USER1 }),
        "RoleManagedRegistry: not a MASTER_ROLE_MANAGEMENT role"
      );
    });

    it("should be possible to call removeContract by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await registry.justAddProxyContract("TEST", _tokenFactory.address);

      await registry.removeContract("TEST");
    });
    it("should not be possible to call removeContract not by the admin", async () => {
      const _tokenFactory = await TokenFactory.new();
      await registry.justAddProxyContract("TEST", _tokenFactory.address);

      await truffleAssert.reverts(
        registry.removeContract("TEST", { from: USER1 }),
        "RoleManagedRegistry: not a MASTER_ROLE_MANAGEMENT role"
      );
    });
  });

  describe("getters", async () => {
    it("should correctly return masterRoles contract with getMasterRoleManagement", async () => {
      assert.equal(await registry.getMasterRoleManagement(), masterRoles.address);
    });

    it("should correctly return tokenFactory contract with getTokenFactory", async () => {
      assert.equal(await registry.getTokenFactory(), tokenFactory.address);
    });
  });
});
