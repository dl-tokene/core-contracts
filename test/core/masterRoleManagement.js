const { accounts } = require("../../scripts/helpers/utils");

const Reverter = require("../helpers/reverter");
const { artifacts } = require("hardhat");
const { assert } = require("chai");

const MasterRoleManagement = artifacts.require("MasterRoleManagement");

describe("MasterRoleManagement", async () => {
  const reverter = new Reverter();

  const SUPER_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const MASTER_REGISTRY_ADMIN_ROLE = "0xbe3b6931ad58d884ac8399c59bbbed7c5fe116d99ea3833c92a2d6987cefec5d";
  const TOKEN_FACTORY_ADMIN_ROLE = "0xd20e79ee7ab22313b1e35bc08d0608b5faca9822ef8dfa3ee1154eb6d6d13df4";

  let OWNER;
  let USER1;
  let USER2;

  let masterRoles;

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);
    USER2 = await accounts(2);

    masterRoles = await MasterRoleManagement.new();
    await masterRoles.__MasterRoleManagement_init();

    await masterRoles.grantRole(MASTER_REGISTRY_ADMIN_ROLE, USER1);
    await masterRoles.grantRole(TOKEN_FACTORY_ADMIN_ROLE, USER2);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("getters", async () => {
    it("Deployer address should be a super admin after deployment", async () => {
      assert.isTrue(await masterRoles.hasRole(SUPER_ADMIN_ROLE, OWNER));
    });

    it("should correctly check the role with hasMasterMasterContractsRegistryAdminRole", async () => {
      assert.isTrue(await masterRoles.hasMasterMasterContractsRegistryAdminRole(USER1));
      await masterRoles.revokeRole(MASTER_REGISTRY_ADMIN_ROLE, USER1);
      assert.isFalse(await masterRoles.hasMasterMasterContractsRegistryAdminRole(USER1));
    });
    it("should correctly check the role for hasTokenFactoryAdminRole", async () => {
      assert.isTrue(await masterRoles.hasTokenFactoryAdminRole(USER2));
      await masterRoles.revokeRole(TOKEN_FACTORY_ADMIN_ROLE, USER2);
      assert.isFalse(await masterRoles.hasTokenFactoryAdminRole(USER2));
    });
  });
});
