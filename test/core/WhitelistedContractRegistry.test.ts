import { ethers } from "hardhat";
import { expect } from "chai";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@/test/helpers/reverter";

import { UPDATE_PERMISSION, WHITELISTED_CONTRACT_REGISTRY_RESOURCE } from "../utils/constants";

import { IRBAC, MasterAccessManagement, MasterContractsRegistry, WhitelistedContractRegistry } from "@ethers-v6";

describe("WhitelistedContractRegistry", () => {
  const reverter = new Reverter();

  const WhitelistedContractRegistryRole = "WCR";

  const WhitelistedContractRegistryUpdate: IRBAC.ResourceWithPermissionsStruct = {
    resource: WHITELISTED_CONTRACT_REGISTRY_RESOURCE,
    permissions: [UPDATE_PERMISSION],
  };

  let OWNER: SignerWithAddress;
  let USER1: SignerWithAddress;
  let USER2: SignerWithAddress;

  let registry: MasterContractsRegistry;
  let masterAccess: MasterAccessManagement;

  let whitelistedContractRegistry: WhitelistedContractRegistry;

  before(async () => {
    [OWNER, USER1, USER2] = await ethers.getSigners();
    const MasterContractsRegistry = await ethers.getContractFactory("MasterContractsRegistry");
    registry = await MasterContractsRegistry.deploy();

    const MasterAccessManagementFactory = await ethers.getContractFactory("MasterAccessManagement");
    masterAccess = await MasterAccessManagementFactory.deploy();
    const WhitelistedContractRegistry = await ethers.getContractFactory("WhitelistedContractRegistry");
    whitelistedContractRegistry = await WhitelistedContractRegistry.deploy();

    await registry.__MasterContractsRegistry_init(masterAccess);

    masterAccess = await ethers.getContractAt("MasterAccessManagement", await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(await registry.WHITELISTED_CONTRACT_REGISTRY_NAME(), whitelistedContractRegistry);

    whitelistedContractRegistry = await ethers.getContractAt(
      "WhitelistedContractRegistry",
      await registry.getWhitelistedContractRegistry(),
    );

    await registry.injectDependencies(await registry.WHITELISTED_CONTRACT_REGISTRY_NAME());

    await masterAccess.addPermissionsToRole(WhitelistedContractRegistryRole, [WhitelistedContractRegistryUpdate], true);
    await masterAccess.grantRoles(await USER1.getAddress(), [WhitelistedContractRegistryRole]);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("basic access", () => {
    it("should not set dependencies from non-dependant", async () => {
      await expect(whitelistedContractRegistry.setDependencies(OWNER, "0x")).to.be.rejectedWith(
        "Dependant: not an injector",
      );
    });
  });

  describe("#addWhitelistedContracts", () => {
    it("should add whitelisted contracts", async () => {
      await whitelistedContractRegistry.connect(USER1).addWhitelistedContracts([USER1.address]);
      expect(await whitelistedContractRegistry.isAllContractsWhitelisted([USER1.address])).to.be.equal(true);
    });

    it("should not add whitelisted contracts without permission", async () => {
      await expect(
        whitelistedContractRegistry.connect(USER2).addWhitelistedContracts([USER1.address]),
      ).to.be.revertedWith("WhitelistedContractRegistry: access denied");
    });
  });

  describe("#removeWhitelistedContracts", () => {
    it("should remove whitelisted contracts", async () => {
      await whitelistedContractRegistry.connect(USER1).addWhitelistedContracts([USER1.address]);
      await whitelistedContractRegistry.connect(USER1).removeWhitelistedContracts([USER1.address]);
      expect(await whitelistedContractRegistry.isAllContractsWhitelisted([USER1.address])).to.be.equal(false);
    });

    it("should not remove whitelisted contracts without permission", async () => {
      await expect(
        whitelistedContractRegistry.connect(USER2).removeWhitelistedContracts([USER1.address]),
      ).to.be.revertedWith("WhitelistedContractRegistry: access denied");
    });
  });

  describe("#isAllContractsWhitelisted", () => {
    it("should return true if contract is whitelisted", async () => {
      await whitelistedContractRegistry.connect(USER1).addWhitelistedContracts([USER1.address]);
      expect(await whitelistedContractRegistry.isAllContractsWhitelisted([USER1.address])).to.be.equal(true);
    });

    it("should return false if contract is not whitelisted", async () => {
      expect(await whitelistedContractRegistry.isAllContractsWhitelisted([USER1.address])).to.be.equal(false);
    });

    it("should return true if all contracts are whitelisted", async () => {
      await whitelistedContractRegistry.connect(USER1).addWhitelistedContracts([USER1.address, USER2.address]);
      expect(
        await whitelistedContractRegistry.isAllContractsWhitelisted([USER1.address, USER1.address, USER2.address]),
      ).to.be.equal(true);
    });

    it("should return false if some contracts are not whitelisted", async () => {
      expect(await whitelistedContractRegistry.isAllContractsWhitelisted([USER1.address, USER2.address])).to.be.equal(
        false,
      );
    });
  });
});
