const { accounts } = require("../../scripts/utils/utils");

const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");

const MulticalleeMock = artifacts.require("MulticalleeMock");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");
const Multicall = artifacts.require("MulticallMock");
const MulticallExecutor = artifacts.require("MulticallExecutor");
const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");

MulticalleeMock.numberFormat = "BigNumber";

describe("Multicall", () => {
  const reverter = new Reverter();

  let OWNER;
  let USER_WITH_ROLE;
  let USER_WITHOUT_ROLE;

  let multicall;
  let executor;
  let multicallee;
  let masterAccess;
  let registry;

  const MULTICALLEE_CALLER_ROLE = "MULTICALLEE_CALLER";

  const ENCODED_FUNCTIONS_TO_CALL = {
    attack: () => {
      return web3.eth.abi.encodeFunctionCall(
        {
          inputs: [],
          name: "attack",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        []
      );
    },

    attackWithValue: () => {
      return web3.eth.abi.encodeFunctionCall(
        {
          inputs: [],
          name: "attackWithValue",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
        []
      );
    },

    addMsgValueWithRole: () => {
      return web3.eth.abi.encodeFunctionCall(
        {
          inputs: [],
          name: "addMsgValueWithRole",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
        []
      );
    },

    addArgumentWithRole: (argument) => {
      return web3.eth.abi.encodeFunctionCall(
        {
          inputs: [
            {
              internalType: "uint256",
              name: "argument_",
              type: "uint256",
            },
          ],
          name: "addArgumentWithRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        [argument]
      );
    },

    addOneWithoutRole: () => {
      return web3.eth.abi.encodeFunctionCall(
        {
          inputs: [],
          name: "addOneWithoutRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        []
      );
    },
  };

  before("setup", async () => {
    OWNER = await accounts(0);
    USER_WITH_ROLE = await accounts(1);
    USER_WITHOUT_ROLE = await accounts(2);

    registry = await MasterContractsRegistry.new();
    const _masterAccess = await MasterAccessManagement.new();
    const _multicall = await Multicall.new();

    await registry.__MasterContractsRegistry_init(_masterAccess.address);

    masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(await registry.MULTICALL_NAME(), _multicall.address);

    multicall = await Multicall.at(await registry.getMulticall());
    await multicall.__Multicall_init();

    await registry.injectDependencies(await registry.MULTICALL_NAME());

    multicallee = await MulticalleeMock.new(multicall.address, masterAccess.address);

    await masterAccess.addPermissionsToRole(
      MULTICALLEE_CALLER_ROLE,
      [
        {
          resource: await multicallee.MULTICALLEE_MOCK_RESOURCE(),
          permissions: [await multicallee.CALL_PERMISSION()],
        },
      ],
      true
    );
    await masterAccess.grantRoles(multicall.address, [await masterAccess.MASTER_ROLE()]);
    await masterAccess.grantRoles(USER_WITH_ROLE, [MULTICALLEE_CALLER_ROLE]);

    executor = await MulticallExecutor.at(await multicall.getMulticallExecutor());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("#__Multicall_init", () => {
    it("should revert when reinitialized", async () => {
      await truffleAssert.reverts(multicall.__Multicall_init(), "Initializable: contract is already initialized");
    });
  });

  describe("#setDependencies", () => {
    it("should not set dependencies from non dependant", async () => {
      await truffleAssert.reverts(multicall.setDependencies(OWNER, "0x"), "Dependant: not an injector");
    });
  });

  describe("#multicall", () => {
    it("should revert if the user doesn't have the required role", async () => {
      await truffleAssert.reverts(
        multicall.multicall([multicallee.address], [ENCODED_FUNCTIONS_TO_CALL.addArgumentWithRole(11)], {
          from: USER_WITHOUT_ROLE,
        }),
        "MulticalleeMock: access denied"
      );
    });

    it("should revert if the executor caller is not the facade", async () => {
      await truffleAssert.reverts(
        executor.multicall([multicallee.address], [ENCODED_FUNCTIONS_TO_CALL.addArgumentWithRole(11)], {
          from: USER_WITH_ROLE,
        }),
        "MulticallExecutor: caller is not the facade"
      );
    });

    it("should revert if wrong parameters", async () => {
      await truffleAssert.reverts(
        multicall.multicall(
          [multicallee.address],
          [ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole(), ENCODED_FUNCTIONS_TO_CALL.addArgumentWithRole(11)],
          { from: USER_WITH_ROLE }
        ),
        "Multicall: lengths mismatch"
      );

      await truffleAssert.reverts(
        multicall.multicall(
          [multicallee.address, multicallee.address],
          [ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole()],
          { from: USER_WITH_ROLE }
        ),
        "Multicall: lengths mismatch"
      );
    });

    it("should revert if reentrancy", async () => {
      await truffleAssert.reverts(
        multicall.multicall([multicallee.address], [ENCODED_FUNCTIONS_TO_CALL.attack()], { from: USER_WITH_ROLE }),
        "ReentrancyGuard: reentrant call"
      );
    });

    it("should execute properly if all conditions are met", async () => {
      await multicall.multicall(
        [multicallee.address, multicallee.address],
        [ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole(), ENCODED_FUNCTIONS_TO_CALL.addArgumentWithRole(11)],
        { from: USER_WITH_ROLE }
      );

      assert.equal((await multicallee.counter()).toFixed(), "12");
      assert.deepEqual(await masterAccess.getUserRoles(executor.address), []);

      await multicall.multicall([multicallee.address], [ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole()], {
        from: USER_WITHOUT_ROLE,
      });

      assert.equal((await multicallee.counter()).toFixed(), "13");
      assert.deepEqual(await masterAccess.getUserRoles(executor.address), []);
    });
  });

  describe("#multicallWithValue", () => {
    it("should revert if the user doesn't have the required role", async () => {
      await truffleAssert.reverts(
        multicall.multicallWithValues([multicallee.address], [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole()], [300], {
          from: USER_WITHOUT_ROLE,
          value: 300,
        }),
        "MulticalleeMock: access denied"
      );
    });

    it("should revert if the executor caller is not the facade", async () => {
      await truffleAssert.reverts(
        executor.multicallWithValues([multicallee.address], [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole()], [300], {
          from: USER_WITH_ROLE,
          value: 300,
        }),
        "MulticallExecutor: caller is not the facade"
      );
    });

    it("should revert if wrong parameters", async () => {
      await truffleAssert.reverts(
        multicall.multicallWithValues(
          [multicallee.address],
          [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole(), ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole()],
          [0, 0],
          { from: USER_WITH_ROLE }
        ),
        "Multicall: lengths mismatch"
      );

      await truffleAssert.reverts(
        multicall.multicallWithValues(
          [multicallee.address, multicallee.address],
          [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole()],
          [0, 0],
          { from: USER_WITH_ROLE }
        ),
        "Multicall: lengths mismatch"
      );

      await truffleAssert.reverts(
        multicall.multicallWithValues(
          [multicallee.address, multicallee.address],
          [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole(), ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole()],
          [0],
          { from: USER_WITH_ROLE }
        ),
        "Multicall: lengths mismatch"
      );
    });

    it("should revert if reentrancy", async () => {
      await truffleAssert.reverts(
        multicall.multicallWithValues([multicallee.address], [ENCODED_FUNCTIONS_TO_CALL.attackWithValue()], [100], {
          from: USER_WITH_ROLE,
          value: 100,
        }),
        "ReentrancyGuard: reentrant call"
      );
    });

    it("should revert if insufficient balance for call", async () => {
      await truffleAssert.reverts(
        multicall.multicallWithValues(
          [multicallee.address, multicallee.address],
          [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole(), ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole()],
          [100, 200],
          { from: USER_WITH_ROLE, value: 299 }
        ),
        "Address: insufficient balance for call"
      );
    });

    it("should execute properly if all conditions are met", async () => {
      await multicall.multicallWithValues(
        [multicallee.address, multicallee.address, multicallee.address],
        [
          ENCODED_FUNCTIONS_TO_CALL.addArgumentWithRole(11),
          ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole(),
          ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole(),
        ],
        [0, 100, 200],
        { from: USER_WITH_ROLE, value: 300 }
      );

      assert.equal((await multicallee.counter()).toFixed(), "311");
      assert.equal(await web3.eth.getBalance(multicallee.address), 300);
      assert.deepEqual(await masterAccess.getUserRoles(executor.address), []);

      await multicall.multicallWithValues([multicallee.address], [ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole()], [0], {
        from: USER_WITHOUT_ROLE,
      });

      assert.equal((await multicallee.counter()).toFixed(), "312");
      assert.equal(await web3.eth.getBalance(multicallee.address), 300);
      assert.deepEqual(await masterAccess.getUserRoles(executor.address), []);
    });
  });
});
