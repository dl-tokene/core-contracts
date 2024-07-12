import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@/test/helpers/reverter";

import { ETHER_ADDR, ZERO_BYTES32 } from "@/scripts/utils/constants";
import { CREATE_PERMISSION, DELETE_PERMISSION, CONSTANTS_REGISTRY_RESOURCE } from "../utils/constants";

import { MasterAccessManagement, ConstantsRegistry, MasterContractsRegistry, IRBAC } from "@ethers-v6";

describe("ConstantsRegistry", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let USER1: SignerWithAddress;

  const ConstantsRegistryRole = "CR";

  const ConstantsRegistryCreate: IRBAC.ResourceWithPermissionsStruct = {
    resource: CONSTANTS_REGISTRY_RESOURCE,
    permissions: [CREATE_PERMISSION],
  };
  const ConstantsRegistryDelete: IRBAC.ResourceWithPermissionsStruct = {
    resource: CONSTANTS_REGISTRY_RESOURCE,
    permissions: [DELETE_PERMISSION],
  };
  let constantsRegistry: ConstantsRegistry;
  let masterAccess: MasterAccessManagement;
  let registry: MasterContractsRegistry;

  before("setup", async () => {
    [OWNER, USER1] = await ethers.getSigners();

    const MasterContractsRegistry = await ethers.getContractFactory("MasterContractsRegistry");
    registry = await MasterContractsRegistry.deploy();

    const MasterAccessManagementFactory = await ethers.getContractFactory("MasterAccessManagement");
    masterAccess = await MasterAccessManagementFactory.deploy();
    const ConstantsRegistryFactory = await ethers.getContractFactory("ConstantsRegistry");
    constantsRegistry = await ConstantsRegistryFactory.deploy();

    await registry.__MasterContractsRegistry_init(masterAccess);
    masterAccess = await ethers.getContractAt("MasterAccessManagement", await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(await registry.CONSTANTS_REGISTRY_NAME(), constantsRegistry);
    constantsRegistry = await ethers.getContractAt("ConstantsRegistry", await registry.getConstantsRegistry());
    await registry.injectDependencies(await registry.CONSTANTS_REGISTRY_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("basic access", () => {
    it("should not set dependencies from non dependant", async () => {
      await expect(constantsRegistry.setDependencies(OWNER.address, "0x")).to.be.rejectedWith(
        "Dependant: not an injector"
      );
    });
  });

  describe("#addBytes", () => {
    const key = "Test";
    const randomBytes = "0xab56545242342000aa";

    it("should not be possible to add a bytes constant without the Create permission", async () => {
      await expect(constantsRegistry.connect(USER1).addBytes(key, randomBytes)).to.be.rejectedWith(
        "ConstantsRegistry: access denied"
      );
    });

    context("if the Create role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to add a bytes constant with the Create permission", async () => {
        expect(await constantsRegistry.connect(USER1).addBytes(key, randomBytes)).to.emit(
          constantsRegistry,
          "AddedBytes"
        );

        expect(await constantsRegistry.getBytes(key)).to.equal(randomBytes);
      });

      it("should not add an empty bytes constant", async () => {
        await expect(constantsRegistry.connect(USER1).addBytes(key, "0x")).to.be.rejectedWith(
          "ConstantsRegistry: empty value"
        );
      });
    });
  });

  describe("#addString", () => {
    const key = "Test";
    const randomString = "mocked long long long long long long long long long long string";

    it("should not be possible to add a string constant without the Create permission", async () => {
      await expect(constantsRegistry.connect(USER1).addString(key, randomString)).to.be.rejectedWith(
        "ConstantsRegistry: access denied"
      );
    });

    context("if the Create role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to add a random string constant", async () => {
        expect(await constantsRegistry.connect(USER1).addString(key, randomString)).to.emit(
          constantsRegistry,
          "AddedString"
        );

        expect(await constantsRegistry.getString(key)).to.be.equal(randomString);
      });

      it("should be possible to add an empty string constant", async () => {
        expect(await constantsRegistry.connect(USER1).addString(key, "")).to.emit(constantsRegistry, "AddedString");

        expect(await constantsRegistry.getString(key)).to.be.equal("");
      });
    });
  });

  describe("#addUint256", () => {
    const key = "Test";
    const randomInteger = 1337;

    it("should not be possible to add an integer constant without the Create permission", async () => {
      await expect(constantsRegistry.connect(USER1).addUint256(key, randomInteger)).to.be.rejectedWith(
        "ConstantsRegistry: access denied"
      );
    });

    context("if the Create role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to add a random integer constant", async () => {
        expect(await constantsRegistry.connect(USER1).addUint256(key, randomInteger)).to.emit(
          constantsRegistry,
          "AddedUint256"
        );

        expect(await constantsRegistry.getUint256(key)).to.be.equal(randomInteger);
      });

      it("should be possible to add a zero integer constant", async () => {
        expect(await constantsRegistry.connect(USER1).addUint256(key, 0)).to.emit(constantsRegistry, "AddedUint256");

        expect(await constantsRegistry.getUint256(key)).to.be.equal(0);
      });
    });
  });

  describe("#addAddress", () => {
    const key = "Test";
    const randomAddress = ETHER_ADDR;

    it("should not be possible to add an address constant without the Create permission", async () => {
      await expect(constantsRegistry.connect(USER1).addAddress(key, randomAddress)).to.be.rejectedWith(
        "ConstantsRegistry: access denied"
      );
    });

    context("if the Create role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to add a random address constant", async () => {
        expect(await constantsRegistry.connect(USER1).addAddress(key, randomAddress)).to.emit(
          constantsRegistry,
          "AddedAddress"
        );

        expect(await constantsRegistry["getAddress(string)"](key)).to.be.equal(randomAddress);
      });

      it("should be possible to add a zero address constant", async () => {
        expect(await constantsRegistry.connect(USER1).addAddress(key, ethers.ZeroAddress)).to.emit(
          constantsRegistry,
          "AddedAddress"
        );

        expect(await constantsRegistry["getAddress(string)"](key)).to.be.equal(ethers.ZeroAddress);
      });
    });
  });

  describe("#addBytes32", () => {
    const key = "Test";
    const randomBytes32 = ZERO_BYTES32.replaceAll("0000", "1234");

    it("should not be possible to add a bytes32 constant without the Create permission", async () => {
      await expect(constantsRegistry.connect(USER1).addBytes32(key, randomBytes32)).to.be.rejectedWith(
        "ConstantsRegistry: access denied"
      );
    });

    context("if the Create role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryCreate], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to add a random bytes32 constant", async () => {
        expect(await constantsRegistry.connect(USER1).addBytes32(key, randomBytes32)).to.emit(
          constantsRegistry,
          "AddedBytes32"
        );

        expect(await constantsRegistry.getBytes32(key)).to.be.equal(randomBytes32);
      });

      it("should be possible to add a zero bytes32 address constant", async () => {
        expect(await constantsRegistry.connect(USER1).addBytes32(key, ZERO_BYTES32)).to.emit(
          constantsRegistry,
          "AddedBytes32"
        );

        expect(await constantsRegistry.getBytes32(key)).to.be.equal(ZERO_BYTES32);
      });
    });
  });

  describe("#remove", () => {
    const key = "Test";
    const randomBytes = "0xab56545242342000aa";

    it("should not be possible to remove a constant without the Delete permission", async () => {
      await constantsRegistry.connect(OWNER).addBytes(key, randomBytes);

      expect(await constantsRegistry.getBytes(key)).to.be.equal(randomBytes);

      await expect(constantsRegistry.connect(USER1).remove(key)).to.be.rejectedWith("ConstantsRegistry: access denied");

      expect(await constantsRegistry.getBytes(key)).to.be.equal(randomBytes);
    });

    context("if the Delete role is granted", () => {
      beforeEach(async () => {
        await masterAccess.addPermissionsToRole(ConstantsRegistryRole, [ConstantsRegistryDelete], true);
        await masterAccess.grantRoles(USER1, [ConstantsRegistryRole]);
      });

      it("should be possible to remove a constant", async () => {
        await constantsRegistry.addBytes(key, randomBytes);

        expect(await constantsRegistry.getBytes(key), randomBytes);
        expect(await constantsRegistry.connect(USER1).remove(key)).to.emit(constantsRegistry, "Removed");
        expect(await constantsRegistry.getBytes(key)).to.be.equal("0x");
      });

      it("should not be possible to remove a nonexistent constant", async () => {
        await expect(constantsRegistry.connect(USER1).remove(key)).to.be.rejectedWith(
          "ConstantsRegistry: constant does not exist"
        );
      });
    });
  });

  describe("#get", () => {
    const key = "Test";

    it("should not be possible to get typed constants if they are not added", async () => {
      expect(await constantsRegistry.getBytes(key)).to.be.equal("0x");

      await expect(constantsRegistry.getString(key)).to.be.rejected;
      await expect(constantsRegistry.getUint256(key)).to.be.rejected;
      await expect(constantsRegistry["getAddress(string)"](key)).to.be.rejected;
      await expect(constantsRegistry.getBytes32(key)).to.be.rejected;
    });
  });
});
