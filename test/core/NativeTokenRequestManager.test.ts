import { MasterContractsRegistry, MasterAccessManagement, NativeTokenRequestManager, IRBAC } from "@ethers-v6";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Reverter } from "@/test/helpers/reverter";
import { NATIVE_TOKEN_REQUEST_MANAGER_RESOURCE, MINT_PERMISSION, BURN_PERMISSION } from "../utils/constants";

describe("NativeTokenRequestManager", () => {
  const reverter = new Reverter();

  const NativeTokenRequestManagerRole = "NTRM";

  const NativeTokenRequestManagerMintBurn: IRBAC.ResourceWithPermissionsStruct = {
    resource: NATIVE_TOKEN_REQUEST_MANAGER_RESOURCE,
    permissions: [MINT_PERMISSION, BURN_PERMISSION],
  };

  let OWNER: SignerWithAddress;
  let USER1: SignerWithAddress;
  let USER2: SignerWithAddress;

  let registry: MasterContractsRegistry;
  let masterAccess: MasterAccessManagement;

  let nativeTokenRequestManager: NativeTokenRequestManager;

  before(async () => {
    [OWNER, USER1, USER2] = await ethers.getSigners();
    const MasterContractsRegistry = await ethers.getContractFactory("MasterContractsRegistry");
    registry = await MasterContractsRegistry.deploy();

    const MasterAccessManagement = await ethers.getContractFactory("MasterAccessManagement");
    masterAccess = await MasterAccessManagement.deploy();
    const NativeTokenRequestManager = await ethers.getContractFactory("NativeTokenRequestManager");
    nativeTokenRequestManager = await NativeTokenRequestManager.deploy();

    await registry.__MasterContractsRegistry_init(masterAccess);
    await nativeTokenRequestManager.__NativeTokenRequestManager_init();

    masterAccess = await ethers.getContractAt("MasterAccessManagement", await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addContract(await registry.NATIVE_TOKEN_REQUEST_MANAGER_NAME(), nativeTokenRequestManager);
    nativeTokenRequestManager = await ethers.getContractAt(
      "NativeTokenRequestManager",
      await registry.getNativeTokenRequestManager(),
    );

    await registry.injectDependencies(await registry.NATIVE_TOKEN_REQUEST_MANAGER_NAME());

    await masterAccess.addPermissionsToRole(NativeTokenRequestManagerRole, [NativeTokenRequestManagerMintBurn], true);
    await masterAccess.grantRoles(USER1, [NativeTokenRequestManagerRole]);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("initialize", () => {
    it("should not allow to re-initialize the contract", async () => {
      await expect(nativeTokenRequestManager.__NativeTokenRequestManager_init()).to.be.revertedWith(
        "Initializable: contract is already initialized",
      );
    });

    it("should not set dependencies from non dependant", async () => {
      await expect(nativeTokenRequestManager.setDependencies(OWNER, "0x")).to.be.rejectedWith(
        "Dependant: not an injector",
      );
    });
  });

  describe("mint", () => {
    it("should mint tokens to the recipient", async () => {
      const tx = await nativeTokenRequestManager.connect(USER1).mint(USER1.address, 1000);

      await expect(tx).to.emit(nativeTokenRequestManager, "MintRequested").withArgs(USER1.address, 1000);
    });

    it("should not mint tokens to the recipient if the sender does not have the permission", async () => {
      await expect(nativeTokenRequestManager.connect(USER2).mint(USER2.address, 1000)).to.be.revertedWith(
        "NativeTokenRequestManager: access denied",
      );
    });
  });

  describe("burn", () => {
    it("should burn tokens from the sender", async () => {
      const tx = await nativeTokenRequestManager.connect(USER1).burn({ value: 1000 });

      await expect(tx).to.emit(nativeTokenRequestManager, "BurnRequested").withArgs();
    });

    it("should not burn tokens from the sender if the sender does not have the permission", async () => {
      await expect(nativeTokenRequestManager.connect(USER2).burn({ value: 1000 })).to.be.revertedWith(
        "NativeTokenRequestManager: access denied",
      );
    });
  });
});
