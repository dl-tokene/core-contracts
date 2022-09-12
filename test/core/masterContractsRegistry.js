const { accounts } = require("../../scripts/helpers/utils");

const Reverter = require("../helpers/reverter");
const { artifacts } = require("hardhat");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const MasterRoleManagement = artifacts.require("MasterRoleManagement");
const TokenFactory = artifacts.require("TokenFactoryRequestable");
const ConstantsRegistry = artifacts.require("ConstantsRegistry");
const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");

describe("MasterContractsRegistry", async () => {
  const reverter = new Reverter();

  const MASTER_REGISTRY_ADMIN_ROLE = "0xbe3b6931ad58d884ac8399c59bbbed7c5fe116d99ea3833c92a2d6987cefec5d";

  let OWNER;
  let USER1;

  let registry;
  let masterRoles;
  let tokenFactory;
  let constantsRegistry;

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);

    const _masterRoles = await MasterRoleManagement.new();

    registry = await MasterContractsRegistry.new();
    const registryProxy = await ERC1967Proxy.new(registry.address, []);
    registry = await MasterContractsRegistry.at(registryProxy.address);
    await registry.__MasterContractsRegistry_init(_masterRoles.address);

    masterRoles = await MasterRoleManagement.at(
      await registry.getContract(await registry.MASTER_ROLE_MANAGEMENT_NAME())
    );
    await masterRoles.__MasterRoleManagement_init();
    await masterRoles.grantRole(MASTER_REGISTRY_ADMIN_ROLE, OWNER);

    const _tokenFactory = await TokenFactory.new();
    await registry.addProxyContract(await registry.TOKEN_FACTORY_NAME(), _tokenFactory.address);

    const _constantsRegistry = await ConstantsRegistry.new();
    await registry.addProxyContract(await registry.CONSTANTS_REGISTRY_NAME(), _constantsRegistry.address);

    tokenFactory = await TokenFactory.at(await registry.getContract(await registry.TOKEN_FACTORY_NAME()));
    constantsRegistry = await ConstantsRegistry.at(
      await registry.getContract(await registry.CONSTANTS_REGISTRY_NAME())
    );

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

    it("should be possible to upgrade UUPS proxy by MASTER_REGISTRY_ADMIN_ROLE", async () => {
      const _registry = await MasterContractsRegistry.new();
      await registry.upgradeTo(_registry.address);
    });

    it("should not be possible to upgrade UUPS proxy not by MASTER_REGISTRY_ADMIN_ROLE", async () => {
      const _registry = await MasterContractsRegistry.new();
      await truffleAssert.reverts(registry.upgradeTo(_registry.address, { from: USER1 }));
    });
  });

  describe("getters", async () => {
    it("should correctly return masterRoles contract with getMasterRoleManagement", async () => {
      assert.equal(await registry.getMasterRoleManagement(), masterRoles.address);
    });

    it("should correctly return tokenFactory contract with getTokenFactory", async () => {
      assert.equal(await registry.getTokenFactory(), tokenFactory.address);
    });

    it("should correctly return constantsRegistry contract with getConstantsRegistry", async () => {
      assert.equal(await registry.getConstantsRegistry(), constantsRegistry.address);
    });
  });
});
