const { accounts } = require("../../scripts/helpers/utils");

const Reverter = require("../helpers/reverter");
const { artifacts } = require("hardhat");
const { assert } = require("chai");

const MasterRoleManagement = artifacts.require("MasterRoleManagement");
const TokenFactory = artifacts.require("TokenFactoryRequestable");
const Registry = artifacts.require("Registry");

const RequestStatus = {
  NONE: 0,
  APPROVED: 1,
  EXECUTED: 2,
};

// const toBaseDeploymentParams = (requester_, deadline_, status_) => {
//     return {requester: requester_, deadline: deadline_, status: status_};
// }

const toERC20InitialParameters = (initHolder_, initSupply_, name_, symbol_) => {
  return { initHolder: initHolder_, initSupply: initSupply_, name: name_, symbol: symbol_ };
};

describe("TokenFactory", async () => {
  const reverter = new Reverter();

  const SUPER_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const MASTER_REGISTRY_ADMIN_ROLE = "0xbe3b6931ad58d884ac8399c59bbbed7c5fe116d99ea3833c92a2d6987cefec5d";
  const TOKEN_FACTORY_ADMIN_ROLE = "0xd20e79ee7ab22313b1e35bc08d0608b5faca9822ef8dfa3ee1154eb6d6d13df4";

  let OWNER;
  let USER1;
  let USER2;
  let USER3;

  let tokenFactory;
  let masterRoles;
  let registry;

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);
    USER2 = await accounts(2);
    USER3 = await accounts(3);

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
    await registry.injectDependencies(await registry.TOKEN_FACTORY_NAME());

    await masterRoles.grantRole(TOKEN_FACTORY_ADMIN_ROLE, USER1);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("requestDeployment", async () => {
    it.only("should be possible to request deployment from enybody and set all storage correctly", async () => {
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, 100, "Test", "TST"));

      console.log(await tokenFactory.erc20Requests(1));
    });

    it("should be possible to request deployment from TokenFactory admin and set all storage correctly", async () => {
      await tokenFactory.requestDeployment();
    });

    it("should correctly set id after creating few requests");
  });

  describe("approveRequest", async () => {
    it("should be possible to approve existing request by TokenFactory admin");
    it("should not be possible to approve existing request not by TokenFactory address");
    it("should not be possible to approve non existing request by the TokenFactory admin");
    it("should not be possible to approve non existing request not by the TokenFactory admin");
    it("should not be possible to approve executed request by the TokenFactory admin");
    it("should not be possible to approve executed request not by the TokenFactory admin");
    it("should not be possble to approve request with passed deadline");
  });

  describe("deployERC20AsAdmin", async () => {
    it("should be possible to deploy by TokenFactory admin and set all initial values correctly");
    it("should not be possible to deploy not by TokenFactory admin");
  });

  describe("deployERC20", async () => {
    it("should be possibe to deploy approved request and set all initial data correctly");
    it("should not be possibe to deploy NOT approved request");
    it("should not be possibe to deploy non existing request");
    it("should not be possible to deploy approed request with wrong requester");
    it("should not be possible to deploy by TokenFactory admin");
    it("should not be possible to deploy request with expired approval");
  });
});
