import { ethers } from "hardhat";
import { expect } from "chai";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@/test/helpers/reverter";

import {
  CREATE_PERMISSION,
  EXECUTE_PERMISSION,
  UPDATE_PERMISSION,
  APPROVE_CONTRACT_REQUESTS_RESOURCE,
  REVIEWABLE_REQUESTS_RESOURCE,
  WHITELISTED_CONTRACT_REGISTRY_RESOURCE,
  DELETE_PERMISSION,
} from "../utils/constants";

import {
  ApproveContractRequests,
  IRBAC,
  MasterAccessManagement,
  MasterContractsRegistry,
  ReviewableRequests,
  WhitelistedContractRegistry,
} from "@ethers-v6";

describe("ApproveContractRequests", () => {
  const reverter = new Reverter();

  const FIRST_REQUEST_ID = 0;
  const DEFAULT_CONTRACT_ADDRESSES = [
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
  ];
  const DEFAULT_SOURCE_CODE_INFO = "default source code info";
  const DEFAULT_CONTACT_INFO = "default contact info";

  const ApproveContractRequestsRole = "ACR";
  const ReviewableRequestsRole = "RR";
  const WhitelistedContractRegistryRole = "WCR";

  const ReviewableRequestsCreateDeleteExecute: IRBAC.ResourceWithPermissionsStruct = {
    resource: REVIEWABLE_REQUESTS_RESOURCE,
    permissions: [CREATE_PERMISSION, DELETE_PERMISSION, EXECUTE_PERMISSION],
  };

  const WhitelistedContractRegistryUpdate: IRBAC.ResourceWithPermissionsStruct = {
    resource: WHITELISTED_CONTRACT_REGISTRY_RESOURCE,
    permissions: [UPDATE_PERMISSION],
  };

  const ApproveContractRequestsUpdate: IRBAC.ResourceWithPermissionsStruct = {
    resource: APPROVE_CONTRACT_REQUESTS_RESOURCE,
    permissions: [UPDATE_PERMISSION],
  };

  let OWNER: SignerWithAddress;
  let USER1: SignerWithAddress;
  let USER2: SignerWithAddress;

  let registry: MasterContractsRegistry;
  let masterAccess: MasterAccessManagement;
  let reviewableRequests: ReviewableRequests;

  let whitelistedContractRegistry: WhitelistedContractRegistry;

  let approveContractRequests: ApproveContractRequests;

  before(async () => {
    [OWNER, USER1, USER2] = await ethers.getSigners();
    const MasterContractsRegistry = await ethers.getContractFactory("MasterContractsRegistry");
    registry = await MasterContractsRegistry.deploy();

    const MasterAccessManagementFactory = await ethers.getContractFactory("MasterAccessManagement");
    masterAccess = await MasterAccessManagementFactory.deploy();
    const ReviewableRequests = await ethers.getContractFactory("ReviewableRequests");
    reviewableRequests = await ReviewableRequests.deploy();
    const WhitelistedContractRegistry = await ethers.getContractFactory("WhitelistedContractRegistry");
    whitelistedContractRegistry = await WhitelistedContractRegistry.deploy();
    const ApproveContractRequests = await ethers.getContractFactory("ApproveContractRequests");
    approveContractRequests = await ApproveContractRequests.deploy();

    await registry.__MasterContractsRegistry_init(masterAccess);

    masterAccess = await ethers.getContractAt("MasterAccessManagement", await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(await registry.REVIEWABLE_REQUESTS_NAME(), reviewableRequests);
    await registry.addProxyContract(await registry.WHITELISTED_CONTRACT_REGISTRY_NAME(), whitelistedContractRegistry);
    await registry.addProxyContract(await registry.APPROVE_CONTRACT_REQUESTS_NAME(), approveContractRequests);

    reviewableRequests = await ethers.getContractAt("ReviewableRequests", await registry.getReviewableRequests());
    whitelistedContractRegistry = await ethers.getContractAt(
      "WhitelistedContractRegistry",
      await registry.getWhitelistedContractRegistry(),
    );
    approveContractRequests = await ethers.getContractAt(
      "ApproveContractRequests",
      await registry.getApproveContractRequests(),
    );

    await registry.injectDependencies(await registry.REVIEWABLE_REQUESTS_NAME());
    await registry.injectDependencies(await registry.WHITELISTED_CONTRACT_REGISTRY_NAME());
    await registry.injectDependencies(await registry.APPROVE_CONTRACT_REQUESTS_NAME());

    await masterAccess.addPermissionsToRole(WhitelistedContractRegistryRole, [WhitelistedContractRegistryUpdate], true);
    await masterAccess.grantRoles(reviewableRequests, [WhitelistedContractRegistryRole]);

    await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsCreateDeleteExecute], true);
    await masterAccess.grantRoles(approveContractRequests, [ReviewableRequestsRole]);
    await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

    await masterAccess.addPermissionsToRole(ApproveContractRequestsRole, [ApproveContractRequestsUpdate], true);
    await masterAccess.grantRoles(USER1, [ApproveContractRequestsRole]);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("basic access", () => {
    it("should not set dependencies from non-dependant", async () => {
      await expect(approveContractRequests.setDependencies(OWNER, "0x")).to.be.rejectedWith(
        "Dependant: not an injector",
      );
    });
  });

  describe("#requestApproveContract", () => {
    it("should correctly request approve contract from a user", async () => {
      const requestHash = await approveContractRequests.getRequestHash(DEFAULT_CONTRACT_ADDRESSES);

      let userRequestInfo = await approveContractRequests.getRequestInfo(requestHash);

      await expect(
        approveContractRequests
          .connect(USER1)
          .requestApproveContract(DEFAULT_CONTRACT_ADDRESSES, DEFAULT_SOURCE_CODE_INFO, DEFAULT_CONTACT_INFO),
      )
        .to.emit(approveContractRequests, "ApproveRequested")
        .withArgs(
          DEFAULT_CONTRACT_ADDRESSES,
          DEFAULT_SOURCE_CODE_INFO,
          DEFAULT_CONTACT_INFO,
          requestHash,
          FIRST_REQUEST_ID,
        );

      userRequestInfo = await approveContractRequests.getRequestInfo(requestHash);

      expect(userRequestInfo.requestId).to.be.equal(FIRST_REQUEST_ID);
      expect(userRequestInfo.contractAddresses).to.be.deep.equal(DEFAULT_CONTRACT_ADDRESSES);
      expect(userRequestInfo.sourceCodeInfo).to.be.equal(DEFAULT_SOURCE_CODE_INFO);
      expect(userRequestInfo.contactInfo).to.be.equal(DEFAULT_CONTACT_INFO);
      expect(userRequestInfo.requestStatus).to.be.equal(1);
      expect(userRequestInfo.misc).to.be.equal(
        `${USER1.address.toLowerCase()}\n${DEFAULT_SOURCE_CODE_INFO}\n${DEFAULT_CONTACT_INFO}`,
      );
    });

    it("should correctly accept reviewable request and add whitelisted contracts", async () => {
      await approveContractRequests
        .connect(USER1)
        .requestApproveContract(DEFAULT_CONTRACT_ADDRESSES, DEFAULT_SOURCE_CODE_INFO, DEFAULT_CONTACT_INFO);

      const request = await reviewableRequests.requests(FIRST_REQUEST_ID);

      expect(request.misc).to.be.equal(
        `${USER1.address.toLowerCase()}\n${DEFAULT_SOURCE_CODE_INFO}\n${DEFAULT_CONTACT_INFO}`,
      );

      await reviewableRequests.connect(USER1).acceptRequest(FIRST_REQUEST_ID);

      expect((await reviewableRequests.requests(FIRST_REQUEST_ID)).status).to.be.equal(2);

      expect(await whitelistedContractRegistry.isAllContractsWhitelisted(DEFAULT_CONTRACT_ADDRESSES)).to.be.equal(true);
    });

    it("should not allow two approve contract requests for one request hash", async () => {
      await approveContractRequests
        .connect(USER1)
        .requestApproveContract(DEFAULT_CONTRACT_ADDRESSES, DEFAULT_SOURCE_CODE_INFO, DEFAULT_CONTACT_INFO);

      await expect(
        approveContractRequests
          .connect(USER1)
          .requestApproveContract(DEFAULT_CONTRACT_ADDRESSES, DEFAULT_SOURCE_CODE_INFO, DEFAULT_CONTACT_INFO),
      ).to.be.revertedWith("ApproveContractRequests: request already exists");
    });

    it("should not allow to request approve contract with empty source code info", async () => {
      await expect(
        approveContractRequests
          .connect(USER1)
          .requestApproveContract(DEFAULT_CONTRACT_ADDRESSES, "", DEFAULT_CONTACT_INFO),
      ).to.be.revertedWith("ApproveContractRequests: source code info is required");
    });

    it("should not allow to request approve contract with empty contact info", async () => {
      await expect(
        approveContractRequests
          .connect(USER1)
          .requestApproveContract(DEFAULT_CONTRACT_ADDRESSES, DEFAULT_SOURCE_CODE_INFO, ""),
      ).to.be.revertedWith("ApproveContractRequests: contact info is required");
    });

    it("should not allow to request approve contract with empty contract addresses", async () => {
      await expect(
        approveContractRequests
          .connect(USER1)
          .requestApproveContract([], DEFAULT_SOURCE_CODE_INFO, DEFAULT_CONTACT_INFO),
      ).to.be.revertedWith("ApproveContractRequests: at least one contract address is required");
    });
  });

  describe("#drop approve request", () => {
    it("should drop pending approve request correctly", async () => {
      const requestHash = await approveContractRequests.getRequestHash(DEFAULT_CONTRACT_ADDRESSES);

      await expect(approveContractRequests.connect(USER1).dropApproveRequest(requestHash)).to.be.revertedWith(
        "ApproveContractRequests: request not found",
      );

      await approveContractRequests
        .connect(USER1)
        .requestApproveContract(DEFAULT_CONTRACT_ADDRESSES, DEFAULT_SOURCE_CODE_INFO, DEFAULT_CONTACT_INFO);

      let userRequestInfo = await approveContractRequests.getRequestInfo(requestHash);
      expect(userRequestInfo.requestId).to.be.equal(FIRST_REQUEST_ID);
      expect(userRequestInfo.contractAddresses).to.be.deep.equal(DEFAULT_CONTRACT_ADDRESSES);
      expect(userRequestInfo.sourceCodeInfo).to.be.equal(DEFAULT_SOURCE_CODE_INFO);
      expect(userRequestInfo.contactInfo).to.be.equal(DEFAULT_CONTACT_INFO);
      expect(userRequestInfo.requestStatus).to.be.equal(1);

      await expect(approveContractRequests.connect(USER1).dropApproveRequest(requestHash))
        .to.emit(approveContractRequests, "ReviewableRequestDropped")
        .withArgs(requestHash, FIRST_REQUEST_ID);

      userRequestInfo = await approveContractRequests.getRequestInfo(requestHash);
      expect(userRequestInfo.requestId).to.be.equal(FIRST_REQUEST_ID);
      expect(userRequestInfo.contractAddresses).to.be.deep.equal(DEFAULT_CONTRACT_ADDRESSES);
      expect(userRequestInfo.sourceCodeInfo).to.be.equal(DEFAULT_SOURCE_CODE_INFO);
      expect(userRequestInfo.contactInfo).to.be.equal(DEFAULT_CONTACT_INFO);
      expect(userRequestInfo.requestStatus).to.be.equal(4);
    });

    it("should not drop approve request without permission", async () => {
      await approveContractRequests
        .connect(USER1)
        .requestApproveContract(DEFAULT_CONTRACT_ADDRESSES, DEFAULT_SOURCE_CODE_INFO, DEFAULT_CONTACT_INFO);

      const requestHash = await approveContractRequests.getRequestHash(DEFAULT_CONTRACT_ADDRESSES);

      await expect(approveContractRequests.connect(USER2).dropApproveRequest(requestHash)).to.be.revertedWith(
        "ApproveContractRequests: access denied",
      );
    });
  });

  describe("#getRequestStatus", () => {
    it("should return request info correctly", async () => {
      const requestHash = await approveContractRequests.getRequestHash(DEFAULT_CONTRACT_ADDRESSES);

      expect(await approveContractRequests.getRequestStatus(requestHash)).to.be.equal(0);

      await approveContractRequests
        .connect(USER1)
        .requestApproveContract(DEFAULT_CONTRACT_ADDRESSES, DEFAULT_SOURCE_CODE_INFO, DEFAULT_CONTACT_INFO);

      expect(await approveContractRequests.getRequestStatus(requestHash)).to.be.equal(1);

      await reviewableRequests.connect(USER1).acceptRequest(FIRST_REQUEST_ID);

      expect(await approveContractRequests.getRequestStatus(requestHash)).to.be.equal(2);
    });

    it("should return request status info correctly for dropped request", async () => {
      const requestHash = await approveContractRequests.getRequestHash(DEFAULT_CONTRACT_ADDRESSES);

      await approveContractRequests
        .connect(USER1)
        .requestApproveContract(DEFAULT_CONTRACT_ADDRESSES, DEFAULT_SOURCE_CODE_INFO, DEFAULT_CONTACT_INFO);

      expect(await approveContractRequests.getRequestStatus(requestHash)).to.be.equal(1);

      await approveContractRequests.dropApproveRequest(requestHash);

      expect(await approveContractRequests.getRequestStatus(requestHash)).to.be.equal(4);
    });
  });
});
