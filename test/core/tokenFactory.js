const { setTime, setNextBlockTime } = require("../helpers/hardhatTimeTraveller");
const { accounts } = require("../../scripts/helpers/utils");

const Reverter = require("../helpers/reverter");
const { artifacts } = require("hardhat");
const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");

const MasterRoleManagement = artifacts.require("MasterRoleManagement");
const TokenFactory = artifacts.require("TokenFactoryRequestable");
const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");
const ERC20 = artifacts.require("ERC20");

const RequestStatus = {
  NONE: 0,
  APPROVED: 1,
  EXECUTED: 2,
};

const toERC20InitialParameters = (initHolder_, initSupply_, name_, symbol_) => {
  return { initHolder: initHolder_, initSupply: initSupply_, name: name_, symbol: symbol_ };
};

describe("TokenFactory", async () => {
  const reverter = new Reverter();

  const MASTER_REGISTRY_ADMIN_ROLE = "0xbe3b6931ad58d884ac8399c59bbbed7c5fe116d99ea3833c92a2d6987cefec5d";
  const TOKEN_FACTORY_ADMIN_ROLE = "0xd20e79ee7ab22313b1e35bc08d0608b5faca9822ef8dfa3ee1154eb6d6d13df4";

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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

    registry = await MasterContractsRegistry.new();
    await registry.__MasterContractsRegistry_init(_masterRoles.address);

    masterRoles = await MasterRoleManagement.at(
      await registry.getContract(await registry.MASTER_ROLE_MANAGEMENT_NAME())
    );
    await masterRoles.__MasterRoleManagement_init();
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
    it("should be possible to request deployment from enybody and set all storage correctly", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      const request0 = await tokenFactory.erc20Requests(0);
      const request = await tokenFactory.erc20Requests(1);

      assert.equal(await tokenFactory.currentId(), 1);
      assert.equal(request0.deploymentParams.requester, ZERO_ADDRESS);
      assert.equal(request0.deploymentParams.deadline, 0);
      assert.equal(request0.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request0.tokenParams.initHolder, ZERO_ADDRESS);
      assert.equal(request0.tokenParams.initSupply, 0);
      assert.equal(request0.tokenParams.name, "");
      assert.equal(request0.tokenParams.symbol, "");

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 0);
      assert.equal(request.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });

    it("should be possible to request deployment from TokenFactory admin and set all storage correctly", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"));

      const request0 = await tokenFactory.erc20Requests(0);
      const request = await tokenFactory.erc20Requests(1);

      assert.equal(request0.deploymentParams.requester, ZERO_ADDRESS);
      assert.equal(request0.deploymentParams.deadline, 0);
      assert.equal(request0.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request0.tokenParams.initHolder, ZERO_ADDRESS);
      assert.equal(request0.tokenParams.initSupply, 0);
      assert.equal(request0.tokenParams.name, "");
      assert.equal(request0.tokenParams.symbol, "");

      assert.equal(request.deploymentParams.requester, OWNER);
      assert.equal(request.deploymentParams.deadline, 0);
      assert.equal(request.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });

    it("should correctly set id after creating few requests", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      const request = await tokenFactory.erc20Requests(1);

      assert.equal(await tokenFactory.currentId(), 1);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 0);
      assert.equal(request.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");

      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test1", "TST"), {
        from: USER1,
      });

      const request1 = await tokenFactory.erc20Requests(2);
      assert.equal(await tokenFactory.currentId(), 2);
      assert.equal(request1.deploymentParams.requester, USER1);
      assert.equal(request1.deploymentParams.deadline, 0);
      assert.equal(request1.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request1.tokenParams.initHolder, USER3);
      assert.equal(request1.tokenParams.initSupply, _initSupply);
      assert.equal(request1.tokenParams.name, "Test1");
      assert.equal(request1.tokenParams.symbol, "TST");

      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test2", "TST"), {
        from: USER3,
      });

      const request2 = await tokenFactory.erc20Requests(3);
      assert.equal(await tokenFactory.currentId(), 3);
      assert.equal(request2.deploymentParams.requester, USER3);
      assert.equal(request2.deploymentParams.deadline, 0);
      assert.equal(request2.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request2.tokenParams.initHolder, USER3);
      assert.equal(request2.tokenParams.initSupply, _initSupply);
      assert.equal(request2.tokenParams.name, "Test2");
      assert.equal(request2.tokenParams.symbol, "TST");

      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test3", "TST"), {
        from: USER3,
      });

      const request3 = await tokenFactory.erc20Requests(4);
      assert.equal(await tokenFactory.currentId(), 4);
      assert.equal(request3.deploymentParams.requester, USER3);
      assert.equal(request3.deploymentParams.deadline, 0);
      assert.equal(request3.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request3.tokenParams.initHolder, USER3);
      assert.equal(request3.tokenParams.initSupply, _initSupply);
      assert.equal(request3.tokenParams.name, "Test3");
      assert.equal(request3.tokenParams.symbol, "TST");
    });
  });

  describe("approveRequest", async () => {
    it("should be possible to approve existing request by TokenFactory admin", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await tokenFactory.approveRequest(1, 1000, { from: USER1 });

      const request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 1000);
      assert.equal(request.deploymentParams.status, RequestStatus.APPROVED);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });

    it("should not be possible to approve existing request not by TokenFactory admin", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await truffleAssert.reverts(
        tokenFactory.approveRequest(1, 1000, { from: USER3 }),
        "TokenFactoryRequestable: not a TOKEN_FACTORY_ADMIN"
      );

      const request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 0);
      assert.equal(request.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });

    it("should not be possible to approve non existing request by the TokenFactory admin", async () => {
      await truffleAssert.reverts(
        tokenFactory.approveRequest(1, 1000, { from: USER1 }),
        "TokenFactoryRequestable: request does not exist"
      );

      const request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, ZERO_ADDRESS);
      assert.equal(request.deploymentParams.deadline, 0);
      assert.equal(request.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request.tokenParams.initHolder, ZERO_ADDRESS);
      assert.equal(request.tokenParams.initSupply, 0);
      assert.equal(request.tokenParams.name, "");
      assert.equal(request.tokenParams.symbol, "");
    });
    it("should not be possible to approve zero request by the TokenFactory admin", async () => {
      await truffleAssert.reverts(
        tokenFactory.approveRequest(1, 1000, { from: USER1 }),
        "TokenFactoryRequestable: request does not exist"
      );

      const request = await tokenFactory.erc20Requests(0);

      assert.equal(request.deploymentParams.requester, ZERO_ADDRESS);
      assert.equal(request.deploymentParams.deadline, 0);
      assert.equal(request.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request.tokenParams.initHolder, ZERO_ADDRESS);
      assert.equal(request.tokenParams.initSupply, 0);
      assert.equal(request.tokenParams.name, "");
      assert.equal(request.tokenParams.symbol, "");
    });
    it("should not be possible to approve non existing request NOT by the TokenFactory admin", async () => {
      await truffleAssert.reverts(
        tokenFactory.approveRequest(1, 1000),
        "TokenFactoryRequestable: not a TOKEN_FACTORY_ADMIN"
      );

      const request = await tokenFactory.erc20Requests(0);

      assert.equal(request.deploymentParams.requester, ZERO_ADDRESS);
      assert.equal(request.deploymentParams.deadline, 0);
      assert.equal(request.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request.tokenParams.initHolder, ZERO_ADDRESS);
      assert.equal(request.tokenParams.initSupply, 0);
      assert.equal(request.tokenParams.name, "");
      assert.equal(request.tokenParams.symbol, "");
    });
    it("should not be possible to approve already approved request by the TokenFactory admin", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await tokenFactory.approveRequest(1, 1000, { from: USER1 });

      let request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.status, RequestStatus.APPROVED);

      await truffleAssert.reverts(
        tokenFactory.approveRequest(1, 1000, { from: USER1 }),
        "TokenFactoryRequestable: invalid request status"
      );

      request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 1000);
      assert.equal(request.deploymentParams.status, RequestStatus.APPROVED);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });

    it("should not be possible to approve already approved request NOT by the TokenFactory admin", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await tokenFactory.approveRequest(1, 1000, { from: USER1 });

      let request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.status, RequestStatus.APPROVED);

      await truffleAssert.reverts(
        tokenFactory.approveRequest(1, 1000),
        "TokenFactoryRequestable: not a TOKEN_FACTORY_ADMIN"
      );

      request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 1000);
      assert.equal(request.deploymentParams.status, RequestStatus.APPROVED);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });
    it("should not be possible to approve executed request by the TokenFactory admin", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await tokenFactory.approveRequest(1, 1000, { from: USER1 });

      let request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.status, RequestStatus.APPROVED);

      await tokenFactory.deployERC20(1, { from: USER3 });
      request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.status, RequestStatus.EXECUTED);

      await truffleAssert.reverts(
        tokenFactory.approveRequest(1, 1000, { from: USER1 }),
        "TokenFactoryRequestable: invalid request status"
      );

      request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 1000);
      assert.equal(request.deploymentParams.status, RequestStatus.EXECUTED);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });
    it("should not be possible to approve executed request NOT by the TokenFactory admin", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await tokenFactory.approveRequest(1, 1000, { from: USER1 });

      let request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.status, RequestStatus.APPROVED);

      await tokenFactory.deployERC20(1, { from: USER3 });
      request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.status, RequestStatus.EXECUTED);

      await truffleAssert.reverts(
        tokenFactory.approveRequest(1, 1000),
        "TokenFactoryRequestable: not a TOKEN_FACTORY_ADMIN"
      );

      request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 1000);
      assert.equal(request.deploymentParams.status, RequestStatus.EXECUTED);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });

    it("should not be possible to approve request with passed deadline", async () => {
      const _initSupply = 100;

      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await setNextBlockTime(1000);

      await truffleAssert.reverts(
        tokenFactory.approveRequest(1, 999, { from: USER1 }),
        "TokenFactoryRequestable: invalid deadline"
      );
    });
  });

  describe("deployERC20AsAdmin", async () => {
    it("should be possible to deploy by TokenFactory admin and set all initial values correctly", async () => {
      const result = await tokenFactory.deployERC20AsAdmin(toERC20InitialParameters(USER3, 1001, "AdminTest", "ATST"), {
        from: USER1,
      });

      const _token = await ERC20.at(result.logs[0].args.token_);

      assert.equal(await _token.balanceOf(USER3), 1001);
      assert.equal(await _token.name(), "AdminTest");
      assert.equal(await _token.symbol(), "ATST");
    });
    it("should not be possible to deploy not by TokenFactory admin", async () => {
      await truffleAssert.reverts(
        tokenFactory.deployERC20AsAdmin(toERC20InitialParameters(USER3, 1001, "AdminTest", "ATST")),
        "TokenFactoryRequestable: not a TOKEN_FACTORY_ADMIN"
      );
    });
  });

  describe("deployERC20", async () => {
    it("should be possibe to deploy approved request and set all initial data correctly", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await tokenFactory.approveRequest(1, 1000, { from: USER1 });

      const result = await tokenFactory.deployERC20(1, { from: USER3 });
      const request = await tokenFactory.erc20Requests(1);
      const _token = await ERC20.at(result.logs[0].args.token_);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 1000);
      assert.equal(request.deploymentParams.status, RequestStatus.EXECUTED);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");

      assert.equal(await _token.balanceOf(USER3), _initSupply);
      assert.equal(await _token.name(), "Test");
      assert.equal(await _token.symbol(), "TST");
    });
    it("should not be possibe to deploy NOT approved request", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await truffleAssert.reverts(tokenFactory.deployERC20(1, { from: USER3 }), "TokenFactory: Invalid request status");
      const request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 0);
      assert.equal(request.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });
    it("should not be possibe to deploy non existing request", async () => {
      await truffleAssert.reverts(
        tokenFactory.deployERC20(1, { from: USER3 }),
        "TokenFactory: Invalid sender for the request"
      );
      const request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, ZERO_ADDRESS);
      assert.equal(request.deploymentParams.deadline, 0);
      assert.equal(request.deploymentParams.status, RequestStatus.NONE);
      assert.equal(request.tokenParams.initHolder, ZERO_ADDRESS);
      assert.equal(request.tokenParams.initSupply, 0);
      assert.equal(request.tokenParams.name, "");
      assert.equal(request.tokenParams.symbol, "");
    });
    it("should not be possible to deploy approved request with wrong requester", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await tokenFactory.approveRequest(1, 1000, { from: USER1 });

      await truffleAssert.reverts(
        tokenFactory.deployERC20(1, { from: USER2 }),
        "TokenFactory: Invalid sender for the request"
      );
      const request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 1000);
      assert.equal(request.deploymentParams.status, RequestStatus.APPROVED);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });
    it("should not be possible to deploy by TokenFactory admin being not requester", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await tokenFactory.approveRequest(1, 1000, { from: USER1 });

      await truffleAssert.reverts(
        tokenFactory.deployERC20(1, { from: USER1 }),
        "TokenFactory: Invalid sender for the request"
      );
      const request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 1000);
      assert.equal(request.deploymentParams.status, RequestStatus.APPROVED);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });
    it("should not be possible to deploy request with expired approval", async () => {
      const _initSupply = 100;
      await tokenFactory.requestERC20Deployment(toERC20InitialParameters(USER3, _initSupply, "Test", "TST"), {
        from: USER3,
      });

      await tokenFactory.approveRequest(1, 1000, { from: USER1 });

      await setTime(1001);

      await truffleAssert.reverts(tokenFactory.deployERC20(1, { from: USER3 }), "TokenFactory: Invalid request status");
      const request = await tokenFactory.erc20Requests(1);

      assert.equal(request.deploymentParams.requester, USER3);
      assert.equal(request.deploymentParams.deadline, 1000);
      assert.equal(request.deploymentParams.status, RequestStatus.APPROVED);
      assert.equal(request.tokenParams.initHolder, USER3);
      assert.equal(request.tokenParams.initSupply, _initSupply);
      assert.equal(request.tokenParams.name, "Test");
      assert.equal(request.tokenParams.symbol, "TST");
    });
  });
});
