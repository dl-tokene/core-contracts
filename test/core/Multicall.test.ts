import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@/test/helpers/reverter";

import {
  MasterAccessManagement,
  MasterContractsRegistry,
  MulticallExecutor,
  MulticallMock,
  MulticalleeMock,
} from "@ethers-v6";

describe("Multicall", () => {
  const provider = ethers.provider;
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let USER_WITH_ROLE: SignerWithAddress;
  let USER_WITHOUT_ROLE: SignerWithAddress;

  let multicall: MulticallMock;
  let executor: MulticallExecutor;
  let multicallee: MulticalleeMock;
  let masterAccess: MasterAccessManagement;
  let registry: MasterContractsRegistry;
  const MULTICALLEE_CALLER_ROLE = "MULTICALLEE_CALLER";
  const ENCODED_FUNCTIONS_TO_CALL = {
    attack: () => {
      return new ethers.Interface([
        {
          inputs: [],
          name: "attack",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ]).encodeFunctionData("attack", []);
    },

    attackWithValue: () => {
      return new ethers.Interface([
        {
          inputs: [],
          name: "attackWithValue",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
      ]).encodeFunctionData("attackWithValue", []);
    },

    addMsgValueWithRole: () => {
      return new ethers.Interface([
        {
          inputs: [],
          name: "addMsgValueWithRole",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
      ]).encodeFunctionData("addMsgValueWithRole", []);
    },

    addArgumentWithRole: (argument: number) => {
      return new ethers.Interface([
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
      ]).encodeFunctionData("addArgumentWithRole", [argument]);
    },

    addOneWithoutRole: () => {
      return new ethers.Interface([
        {
          inputs: [],
          name: "addOneWithoutRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ]).encodeFunctionData("addOneWithoutRole", []);
    },
  };

  before("setup", async () => {
    [OWNER, USER_WITH_ROLE, USER_WITHOUT_ROLE] = await ethers.getSigners();
    const MasterContractsRegistry = await ethers.getContractFactory("MasterContractsRegistry");
    registry = await MasterContractsRegistry.deploy();

    const MasterAccessManagementFactory = await ethers.getContractFactory("MasterAccessManagement");
    masterAccess = await MasterAccessManagementFactory.deploy();
    const Multicall = await ethers.getContractFactory("MulticallMock");
    multicall = await Multicall.deploy();

    await registry.__MasterContractsRegistry_init(masterAccess);

    masterAccess = await ethers.getContractAt("MasterAccessManagement", await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(await registry.MULTICALL_NAME(), multicall);

    multicall = await ethers.getContractAt("MulticallMock", await registry.getMulticall());
    await multicall.__Multicall_init();

    await registry.injectDependencies(await registry.MULTICALL_NAME());
    const MulticalleeMock = await ethers.getContractFactory("MulticalleeMock");
    multicallee = await MulticalleeMock.deploy(await multicall.getAddress(), await masterAccess.getAddress());

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
    await masterAccess.grantRoles(await multicall.getAddress(), [await masterAccess.MASTER_ROLE()]);
    await masterAccess.grantRoles(USER_WITH_ROLE, [MULTICALLEE_CALLER_ROLE]);
    const MulticallExecutor = await ethers.getContractFactory("MulticallExecutor");
    executor = await ethers.getContractAt("MulticallExecutor", await multicall.getMulticallExecutor());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("#__Multicall_init", () => {
    it("should revert when reinitialized", async () => {
      await expect(multicall.__Multicall_init()).to.be.rejectedWith("Initializable: contract is already initialized");
    });
  });

  describe("#setDependencies", () => {
    it("should not set dependencies from non dependant", async () => {
      await expect(multicall.setDependencies(OWNER, "0x")).to.be.rejectedWith("Dependant: not an injector");
    });
  });

  describe("#multicall", () => {
    it("should revert if the user doesn't have the required role", async () => {
      await expect(
        multicall
          .connect(USER_WITHOUT_ROLE)
          .multicall([multicallee], [ENCODED_FUNCTIONS_TO_CALL.addArgumentWithRole(11)])
      ).to.be.rejectedWith("MulticalleeMock: access denied");
    });

    it("should revert if the executor caller is not the facade", async () => {
      await expect(
        executor.connect(USER_WITH_ROLE).multicall([multicallee], [ENCODED_FUNCTIONS_TO_CALL.addArgumentWithRole(11)])
      ).to.be.rejectedWith("MulticallExecutor: caller is not the facade");
    });

    it("should revert if wrong parameters", async () => {
      await expect(
        multicall
          .connect(USER_WITH_ROLE)
          .multicall(
            [multicallee],
            [ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole(), ENCODED_FUNCTIONS_TO_CALL.addArgumentWithRole(11)]
          )
      ).to.be.rejectedWith("Multicall: lengths mismatch");

      await expect(
        multicall
          .connect(USER_WITH_ROLE)
          .multicall([multicallee, multicallee], [ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole()])
      ).to.be.rejectedWith("Multicall: lengths mismatch");
    });

    it("should revert if reentrancy", async () => {
      await expect(
        multicall.connect(USER_WITH_ROLE).multicall([multicallee], [ENCODED_FUNCTIONS_TO_CALL.attack()])
      ).to.be.rejectedWith("ReentrancyGuard: reentrant call");
    });

    it("should execute properly if all conditions are met", async () => {
      await multicall
        .connect(USER_WITH_ROLE)
        .multicall(
          [multicallee, multicallee],
          [ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole(), ENCODED_FUNCTIONS_TO_CALL.addArgumentWithRole(11)]
        );

      expect(await multicallee.counter()).to.be.equal("12");
      expect(await masterAccess.getUserRoles(executor)).to.be.deep.equal([]);

      await multicall
        .connect(USER_WITHOUT_ROLE)
        .multicall([multicallee], [ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole()]);

      expect(await multicallee.counter()).to.be.equal("13");
      expect(await masterAccess.getUserRoles(executor)).to.be.deep.equal([]);
    });
  });

  describe("#multicallWithValue", () => {
    it("should revert if the user doesn't have the required role", async () => {
      await expect(
        multicall
          .connect(USER_WITH_ROLE)
          .connect(USER_WITHOUT_ROLE)
          .multicallWithValues([multicallee], [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole()], [300], {
            value: 300,
          })
      ).to.be.rejectedWith("MulticalleeMock: access denied");
    });

    it("should revert if the executor caller is not the facade", async () => {
      await expect(
        executor
          .connect(USER_WITH_ROLE)
          .multicallWithValues([multicallee], [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole()], [300], {
            value: 300,
          })
      ).to.be.rejectedWith("MulticallExecutor: caller is not the facade");
    });

    it("should revert if wrong parameters", async () => {
      await expect(
        multicall
          .connect(USER_WITH_ROLE)
          .multicallWithValues(
            [multicallee],
            [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole(), ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole()],
            [0, 0]
          )
      ).to.be.rejectedWith("Multicall: lengths mismatch");

      await expect(
        multicall
          .connect(USER_WITH_ROLE)
          .multicallWithValues([multicallee, multicallee], [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole()], [0, 0])
      ).to.be.rejectedWith("Multicall: lengths mismatch");

      await expect(
        multicall
          .connect(USER_WITH_ROLE)
          .multicallWithValues(
            [multicallee, multicallee],
            [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole(), ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole()],
            [0]
          )
      ).to.be.rejectedWith("Multicall: lengths mismatch");
    });

    it("should revert if reentrancy", async () => {
      await expect(
        multicall
          .connect(USER_WITH_ROLE)
          .multicallWithValues([multicallee], [ENCODED_FUNCTIONS_TO_CALL.attackWithValue()], [100], {
            value: 100,
          })
      ).to.be.rejectedWith("ReentrancyGuard: reentrant call");
    });

    it("should revert if insufficient balance for call", async () => {
      await expect(
        multicall
          .connect(USER_WITH_ROLE)
          .multicallWithValues(
            [multicallee, multicallee],
            [ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole(), ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole()],
            [100, 200],
            { value: 299 }
          )
      ).to.be.rejectedWith("Address: insufficient balance for call");
    });

    it("should execute properly if all conditions are met", async () => {
      await multicall
        .connect(USER_WITH_ROLE)
        .multicallWithValues(
          [multicallee, multicallee, multicallee],
          [
            ENCODED_FUNCTIONS_TO_CALL.addArgumentWithRole(11),
            ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole(),
            ENCODED_FUNCTIONS_TO_CALL.addMsgValueWithRole(),
          ],
          [0, 100, 200],
          { value: 300 }
        );

      expect(await multicallee.counter()).to.be.equal("311");
      expect(await provider.getBalance(multicallee)).to.be.equal(300);
      expect(await masterAccess.getUserRoles(executor)).to.be.deep.equal([]);

      await multicall
        .connect(USER_WITHOUT_ROLE)
        .multicallWithValues([multicallee], [ENCODED_FUNCTIONS_TO_CALL.addOneWithoutRole()], [0]);

      expect(await multicallee.counter()).to.be.equal("312");
      expect(await provider.getBalance(multicallee)).to.be.equal(300);
      expect(await masterAccess.getUserRoles(executor)).to.be.deep.equal([]);
    });
  });
});
