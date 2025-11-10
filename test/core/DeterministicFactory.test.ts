import { expect } from "chai";
import { ethers } from "hardhat";
import { Reverter } from "@/test/helpers/reverter";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  DeterministicFactory,
  DeterministicFactory__factory,
  IRBAC,
  MasterAccessManagement,
  MasterContractsRegistry,
} from "@/generated-types";
import { ZERO_BYTES32 } from "@/scripts/utils/constants";
import { generateDeterministicFactoryDeployTransaction } from "@/scripts/generateDFDeployTransaction";

describe("DeterministicFactory", () => {
  let OWNER: SignerWithAddress;
  let USER1: SignerWithAddress;
  let USER2: SignerWithAddress;

  const DETERMINISTIC_FACTORY_DEP = "DETERMINISTIC_FACTORY";
  const DETERMINISTIC_FACTORY_ROLE = "DETERMINISTIC_FACTORY_ROLE";
  const DETERMINISTIC_FACTORY_RESOURCE = "DETERMINISTIC_FACTORY_RESOURCE";
  const DEPLOY_PERMISSION = "DEPLOY";
  const DETERMINISTIC_FACTORY_DEPLOY: IRBAC.ResourceWithPermissionsStruct = {
    resource: DETERMINISTIC_FACTORY_RESOURCE,
    permissions: [DEPLOY_PERMISSION],
  };

  let registry: MasterContractsRegistry;
  let masterAccess: MasterAccessManagement;
  let deterministicFactory: DeterministicFactory;

  const reverter = new Reverter();

  before("setup", async () => {
    [OWNER, USER1, USER2] = await ethers.getSigners();

    const MasterContractsRegistry = await ethers.getContractFactory("MasterContractsRegistry");
    registry = await MasterContractsRegistry.deploy();

    const MasterAccessManagementFactory = await ethers.getContractFactory("MasterAccessManagement");
    masterAccess = await MasterAccessManagementFactory.deploy();
    const DeterministicFactoryFactory = await ethers.getContractFactory("DeterministicFactory");
    deterministicFactory = await DeterministicFactoryFactory.deploy();

    await registry.__MasterContractsRegistry_init(masterAccess);
    masterAccess = await ethers.getContractAt("MasterAccessManagement", await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addContract(DETERMINISTIC_FACTORY_DEP, deterministicFactory);
    deterministicFactory = await ethers.getContractAt(
      "DeterministicFactory",
      await registry.getContract(DETERMINISTIC_FACTORY_DEP),
    );
    await registry.injectDependencies(DETERMINISTIC_FACTORY_DEP);

    await masterAccess.addPermissionsToRole(DETERMINISTIC_FACTORY_ROLE, [DETERMINISTIC_FACTORY_DEPLOY], true);
    await masterAccess.grantRoles(USER1, [DETERMINISTIC_FACTORY_ROLE]);

    await deterministicFactory.__DeterministicFactory_init();

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("basic access", () => {
    it("should not set dependencies from non dependant", async () => {
      await expect(deterministicFactory.setDependencies(OWNER.address, "0x")).to.be.rejectedWith(
        "Dependant: not an injector",
      );
    });

    it("should not initialize twice", async () => {
      await expect(deterministicFactory.__DeterministicFactory_init()).to.be.rejectedWith(
        "Initializable: contract is already initialized",
      );
    });
  });

  describe("deploy", () => {
    it("should deploy a contract with the Deploy permission", async () => {
      const expectedAddress = ethers.getCreate2Address(
        await deterministicFactory.getAddress(),
        await deterministicFactory.computeDeploymentSalt(USER1.address, ZERO_BYTES32),
        ethers.keccak256(DeterministicFactory__factory.bytecode),
      );
      const tx = await deterministicFactory.connect(USER1).deploy(ZERO_BYTES32, DeterministicFactory__factory.bytecode);
      await expect(tx).to.emit(deterministicFactory, "Deployed").withArgs(USER1.address, expectedAddress);
    });

    it("should not deploy a contract without the Deploy permission", async () => {
      await expect(deterministicFactory.connect(USER2).deploy(ZERO_BYTES32, "0x")).to.be.rejectedWith(
        "DeterministicFactory: access denied",
      );
    });
  });

  describe("computeDeploymentSalt", () => {
    it("should compute the deployment salt", async () => {
      const salt = await deterministicFactory.computeDeploymentSalt(USER1.address, ZERO_BYTES32);
      expect(salt).to.equal(ethers.solidityPackedKeccak256(["address", "bytes32"], [USER1.address, ZERO_BYTES32]));
    });
  });

  describe("computeAddress", () => {
    it("should compute the address of a contract using the salt", async () => {
      const expectedAddress = ethers.getCreate2Address(
        await deterministicFactory.getAddress(),
        await deterministicFactory.computeDeploymentSalt(USER1.address, ZERO_BYTES32),
        ethers.keccak256(DeterministicFactory__factory.bytecode),
      );
      const address = await deterministicFactory.computeAddress(
        USER1.address,
        ZERO_BYTES32,
        ethers.keccak256(DeterministicFactory__factory.bytecode),
      );
      expect(address).to.equal(expectedAddress);
    });
  });

  describe("deterministic deployment", () => {
    it("should deploy a contract", async () => {
      const txData = await generateDeterministicFactoryDeployTransaction();

      await OWNER.sendTransaction({
        to: txData.signerAddress,
        value: BigInt(txData.gasLimit) * BigInt(txData.gasPrice),
      });

      const txReceipt = await ethers.provider.send("eth_sendRawTransaction", [txData.transaction]);
      const receipt = await ethers.provider.getTransactionReceipt(txReceipt);

      expect(receipt).to.not.be.null;

      expect(receipt!.status).to.equal(1);
      expect(receipt!.contractAddress!.toLowerCase()).to.equal(txData.address.toLowerCase());

      const deterministicFactory = await ethers.getContractAt("DeterministicFactory", txData.address);
      const tx = await deterministicFactory.__DeterministicFactory_init();

      await expect(tx).to.emit(deterministicFactory, "Initialized");
    });
  });
});
