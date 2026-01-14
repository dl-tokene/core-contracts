import { ethers } from "hardhat";
import { expect } from "chai";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@/test/helpers/reverter";

import {
  CREATE_PERMISSION,
  EXECUTE_PERMISSION,
  UPDATE_PERMISSION,
  REVIEWABLE_REQUESTS_RESOURCE,
  WHITELISTED_CONTRACT_REGISTRY_RESOURCE,
  DELETE_PERMISSION,
  EXTERNAL_PROJECT_REGISTRY_RESOURCE,
  RBAC_RESOURCE,
  RequestStatus,
  DEPLOY_PERMISSION,
  DETERMINISTIC_FACTORY_RESOURCE,
} from "../utils/constants";

import {
  ExternalProjectRegistry,
  IExternalProjectRegistry,
  IRBAC,
  MasterAccessManagement,
  MasterContractsRegistry,
  ReviewableRequests,
  WhitelistedContractRegistry,
} from "@ethers-v6";

describe("ExternalProjectRegistry", () => {
  const reverter = new Reverter();

  const FIRST_REQUEST_ID = 0;
  const SECOND_REQUEST_ID = 1;

  const DEFAULT_PROJECT_NAME = "default project name";
  const DEFAULT_SOURCE_CODE_INFO = "default source code info";
  const DEFAULT_CONTACT_INFO = "default contact info";
  const DEFAULT_LOGO_URL = "default logo url";
  const DEFAULT_BANNER_URL = "default banner url";
  const DEFAULT_CONTRACT_ADDRESSES = [
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
  ];
  const DEFAULT_ROLE = "default role";
  const DEFAULT_PERMISSIONS = [
    {
      resource: "default resource",
      permissions: ["default permission"],
    },
  ];

  const UPDATED_SOURCE_CODE_INFO = "updated source code info";
  const UPDATED_CONTACT_INFO = "updated contact info";
  const UPDATED_LOGO_URL = "updated logo url";
  const UPDATED_BANNER_URL = "updated banner url";
  const UPDATED_CONTRACT_ADDRESSES = [
    "0x0000000000000000000000000000000000000003",
    "0x0000000000000000000000000000000000000004",
  ];
  const NEW_PERMISSIONS = [
    {
      resource: "new resource",
      permissions: ["new permission"],
    },
  ];

  const ExternalProjectRegistryRole = "EPR";
  const ReviewableRequestsRole = "RR";
  const WhitelistedContractRegistryRole = "WCR";
  const MasterAccessManagementRole = "MAC";
  const DeterministicFactoryRole = "DF";

  const ReviewableRequestsCreateDeleteExecute: IRBAC.ResourceWithPermissionsStruct = {
    resource: REVIEWABLE_REQUESTS_RESOURCE,
    permissions: [CREATE_PERMISSION, DELETE_PERMISSION, EXECUTE_PERMISSION],
  };

  const WhitelistedContractRegistryUpdate: IRBAC.ResourceWithPermissionsStruct = {
    resource: WHITELISTED_CONTRACT_REGISTRY_RESOURCE,
    permissions: [UPDATE_PERMISSION],
  };

  const MasterAccessManagementCreatePermissions: IRBAC.ResourceWithPermissionsStruct = {
    resource: RBAC_RESOURCE,
    permissions: [CREATE_PERMISSION, DELETE_PERMISSION],
  };

  const ExternalProjectRegistryCreateUpdate: IRBAC.ResourceWithPermissionsStruct = {
    resource: EXTERNAL_PROJECT_REGISTRY_RESOURCE,
    permissions: [CREATE_PERMISSION, UPDATE_PERMISSION],
  };
  const DETERMINISTIC_FACTORY_DEPLOY: IRBAC.ResourceWithPermissionsStruct = {
    resource: DETERMINISTIC_FACTORY_RESOURCE,
    permissions: [DEPLOY_PERMISSION],
  };

  let OWNER: SignerWithAddress;
  let USER1: SignerWithAddress;
  let USER2: SignerWithAddress;

  let registry: MasterContractsRegistry;
  let masterAccess: MasterAccessManagement;
  let reviewableRequests: ReviewableRequests;

  let whitelistedContractRegistry: WhitelistedContractRegistry;

  let externalProjectRegistry: ExternalProjectRegistry;

  const defaultProject = () => ({
    owner: USER1.address,
    name: DEFAULT_PROJECT_NAME,
    sourceCodeInfo: DEFAULT_SOURCE_CODE_INFO,
    contactInfo: DEFAULT_CONTACT_INFO,
    logoUrl: DEFAULT_LOGO_URL,
    bannerUrl: DEFAULT_BANNER_URL,
    contractAddresses: DEFAULT_CONTRACT_ADDRESSES,
    role: DEFAULT_ROLE,
    permissions: DEFAULT_PERMISSIONS,
  });

  const defaultUpdateParams = (projectId: string) => ({
    projectId: projectId,
    owner: USER2.address,
    sourceCodeInfo: UPDATED_SOURCE_CODE_INFO,
    contactInfo: UPDATED_CONTACT_INFO,
    logoUrl: UPDATED_LOGO_URL,
    bannerUrl: UPDATED_BANNER_URL,
    contractAddressesToAdd: UPDATED_CONTRACT_ADDRESSES,
    contractAddressesToRemove: DEFAULT_CONTRACT_ADDRESSES,
    role: DEFAULT_ROLE,
    permissionsToAdd: NEW_PERMISSIONS,
    permissionsToRemove: [],
  });

  const compareProjects = (
    project1: IExternalProjectRegistry.ExternalProjectStruct,
    project2: IExternalProjectRegistry.ExternalProjectStruct,
  ) => {
    expect(project1.owner).to.be.equal(project2.owner);
    expect(project1.name).to.be.equal(project2.name);
    expect(project1.sourceCodeInfo).to.be.equal(project2.sourceCodeInfo);
    expect(project1.contactInfo).to.be.equal(project2.contactInfo);
    expect(project1.logoUrl).to.be.equal(project2.logoUrl);
    expect(project1.bannerUrl).to.be.equal(project2.bannerUrl);
    expect(project1.contractAddresses).to.be.deep.equal(project2.contractAddresses);
    expect(project1.role).to.be.equal(project2.role);
    expect(project1.permissions.length).to.be.equal(project2.permissions.length);
    for (const permission of project1.permissions) {
      expect(permission.resource).to.be.equal(
        project2.permissions.find((p) => p.resource === permission.resource)!.resource,
      );
      expect(permission.permissions).to.be.deep.equal(
        project2.permissions.find((p) => p.resource === permission.resource)!.permissions,
      );
    }
  };

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
    const ExternalProjectRegistry = await ethers.getContractFactory("ExternalProjectRegistry");
    externalProjectRegistry = await ExternalProjectRegistry.deploy();

    await registry.__MasterContractsRegistry_init(masterAccess);

    masterAccess = await ethers.getContractAt("MasterAccessManagement", await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(await registry.REVIEWABLE_REQUESTS_NAME(), reviewableRequests);
    await registry.addProxyContract(await registry.WHITELISTED_CONTRACT_REGISTRY_NAME(), whitelistedContractRegistry);
    await registry.addProxyContract(await registry.EXTERNAL_PROJECT_REGISTRY_NAME(), externalProjectRegistry);

    reviewableRequests = await ethers.getContractAt("ReviewableRequests", await registry.getReviewableRequests());
    whitelistedContractRegistry = await ethers.getContractAt(
      "WhitelistedContractRegistry",
      await registry.getWhitelistedContractRegistry(),
    );
    externalProjectRegistry = await ethers.getContractAt(
      "ExternalProjectRegistry",
      await registry.getExternalProjectRegistry(),
    );

    await registry.injectDependencies(await registry.REVIEWABLE_REQUESTS_NAME());
    await registry.injectDependencies(await registry.WHITELISTED_CONTRACT_REGISTRY_NAME());
    await registry.injectDependencies(await registry.EXTERNAL_PROJECT_REGISTRY_NAME());

    await masterAccess.addPermissionsToRole(WhitelistedContractRegistryRole, [WhitelistedContractRegistryUpdate], true);
    await masterAccess.grantRoles(externalProjectRegistry, [WhitelistedContractRegistryRole]);

    await masterAccess.addPermissionsToRole(
      MasterAccessManagementRole,
      [MasterAccessManagementCreatePermissions],
      true,
    );
    await masterAccess.grantRoles(externalProjectRegistry, [MasterAccessManagementRole]);

    await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsCreateDeleteExecute], true);
    await masterAccess.grantRoles(externalProjectRegistry, [ReviewableRequestsRole]);
    await masterAccess.grantRoles(USER1, [ReviewableRequestsRole]);

    await masterAccess.addPermissionsToRole(ExternalProjectRegistryRole, [ExternalProjectRegistryCreateUpdate], true);
    await masterAccess.grantRoles(USER1, [ExternalProjectRegistryRole]);
    await masterAccess.grantRoles(reviewableRequests, [ExternalProjectRegistryRole]);

    await masterAccess.addPermissionsToRole(DeterministicFactoryRole, [DETERMINISTIC_FACTORY_DEPLOY], true);
    await masterAccess.grantRoles(USER1, [DeterministicFactoryRole]);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("basic access", () => {
    it("should not set dependencies from non-dependant", async () => {
      await expect(externalProjectRegistry.setDependencies(OWNER, "0x")).to.be.rejectedWith(
        "Dependant: not an injector",
      );
    });
  });

  describe("#requestAddProject", () => {
    it("should correctly request create external project from a user", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);

      await expect(externalProjectRegistry.connect(USER1).requestAddProject(defaultProject()))
        .to.emit(externalProjectRegistry, "AddProjectRequested")
        .withArgs(projectId, FIRST_REQUEST_ID);

      const acceptData = externalProjectRegistry.interface.encodeFunctionData("addProject", [defaultProject()]);

      const request = await reviewableRequests.requests(FIRST_REQUEST_ID);

      expect(request.creator).to.be.equal(await externalProjectRegistry.getAddress());
      expect(request.executor).to.be.equal(await externalProjectRegistry.getAddress());
      expect(request.acceptData).to.be.equal(acceptData);
      expect(request.rejectData).to.be.equal("0x");
      expect(request.misc).to.be.equal(DEFAULT_PROJECT_NAME);
    });

    it("should not request create external project from a non-deployer", async () => {
      await expect(externalProjectRegistry.connect(USER2).requestAddProject(defaultProject())).to.be.rejectedWith(
        "ExternalProjectRegistry: access denied",
      );
    });

    it("should not request create external project with same request hash", async () => {
      await externalProjectRegistry.connect(USER1).requestAddProject(defaultProject());

      await expect(externalProjectRegistry.connect(USER1).requestAddProject(defaultProject())).to.be.rejectedWith(
        "ExternalProjectRegistry: request already exists",
      );
    });
  });

  describe("#dropAddProjectRequest", () => {
    it("should drop pending create external project request correctly", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);

      await externalProjectRegistry.connect(USER1).requestAddProject(defaultProject());

      await expect(externalProjectRegistry.connect(USER1).dropAddProjectRequest(projectId))
        .to.emit(externalProjectRegistry, "AddProjectRequestDropped")
        .withArgs(projectId, FIRST_REQUEST_ID);

      const request = await reviewableRequests.requests(FIRST_REQUEST_ID);

      expect(request.status).to.be.equal(RequestStatus.DROPPED);
    });

    it("should not drop create external project request without permission", async () => {
      await externalProjectRegistry.connect(USER1).requestAddProject(defaultProject());

      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);

      await expect(externalProjectRegistry.connect(USER2).dropAddProjectRequest(projectId)).to.be.revertedWith(
        "ExternalProjectRegistry: access denied",
      );
    });

    it("should not drop create external project request if it does not exist", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);

      await expect(externalProjectRegistry.connect(USER1).dropAddProjectRequest(projectId)).to.be.rejectedWith(
        "ExternalProjectRegistry: request not found",
      );
    });
  });

  describe("#addProject", () => {
    it("should correctly add project", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);

      const projectToAdd = defaultProject();

      const tx = await externalProjectRegistry.connect(USER1).addProject(projectToAdd);
      await expect(tx)
        .to.emit(externalProjectRegistry, "ProjectAdded")
        .withArgs(
          projectId,
          projectToAdd.owner,
          projectToAdd.role,
          projectToAdd.contractAddresses,
          projectToAdd.logoUrl,
          projectToAdd.bannerUrl,
        );

      const projectFromRegistry = await externalProjectRegistry.getProject(projectId);

      compareProjects(projectFromRegistry, projectToAdd);
    });

    describe("integration", () => {
      it("should correctly add project with whitelisted contracts", async () => {
        expect(await whitelistedContractRegistry.isAllContractsWhitelisted(DEFAULT_CONTRACT_ADDRESSES)).to.be.equal(
          false,
        );

        const tx = await externalProjectRegistry.connect(USER1).addProject(defaultProject());

        await expect(tx)
          .to.emit(whitelistedContractRegistry, "WhitelistedContractsAdded")
          .withArgs(DEFAULT_CONTRACT_ADDRESSES);

        expect(await whitelistedContractRegistry.isAllContractsWhitelisted(DEFAULT_CONTRACT_ADDRESSES)).to.be.equal(
          true,
        );
      });

      it("should not add project without permission", async () => {
        await expect(externalProjectRegistry.connect(USER2).addProject(defaultProject())).to.be.revertedWith(
          "ExternalProjectRegistry: access denied",
        );
      });

      it("should not add project with same name", async () => {
        await externalProjectRegistry.connect(USER1).addProject(defaultProject());

        await expect(externalProjectRegistry.connect(USER1).addProject(defaultProject())).to.be.revertedWith(
          "ExternalProjectRegistry: project with this name already exists",
        );
      });

      it("should correctly add project with permissions", async () => {
        const tx = await externalProjectRegistry.connect(USER1).addProject(defaultProject());

        for (const permission of DEFAULT_PERMISSIONS) {
          await expect(tx)
            .to.emit(masterAccess, "AddedPermissions")
            .withArgs(DEFAULT_ROLE, permission.resource, permission.permissions, true);
        }

        expect((await masterAccess.getRolePermissions(DEFAULT_ROLE)).disallowed_.length).to.be.equal(0);

        const rolePermissions = (await masterAccess.getRolePermissions(DEFAULT_ROLE)).allowed_;
        expect(rolePermissions.length).to.be.equal(DEFAULT_PERMISSIONS.length);
        for (const permission of rolePermissions) {
          expect(permission.resource).to.be.equal(
            DEFAULT_PERMISSIONS.find((p) => p.resource === permission.resource)!.resource,
          );
          expect(permission.permissions).to.be.deep.equal(permission.permissions);
        }
      });
    });

    describe("validation", () => {
      it("should not add project with zero address owner", async () => {
        await expect(
          externalProjectRegistry.connect(USER1).addProject({ ...defaultProject(), owner: ethers.ZeroAddress }),
        ).to.be.revertedWith("ExternalProjectRegistry: owner is empty");
      });

      it("should not add project with empty name", async () => {
        await expect(
          externalProjectRegistry.connect(USER1).addProject({ ...defaultProject(), name: "" }),
        ).to.be.revertedWith("ExternalProjectRegistry: project name is empty");
      });

      it("should not add project with empty source code info", async () => {
        await expect(
          externalProjectRegistry.connect(USER1).addProject({ ...defaultProject(), sourceCodeInfo: "" }),
        ).to.be.revertedWith("ExternalProjectRegistry: source code info is empty");
      });

      it("should not add project with empty contact info", async () => {
        await expect(
          externalProjectRegistry.connect(USER1).addProject({ ...defaultProject(), contactInfo: "" }),
        ).to.be.revertedWith("ExternalProjectRegistry: contact info is empty");
      });

      it("should not add project with empty logo url", async () => {
        await expect(
          externalProjectRegistry.connect(USER1).addProject({ ...defaultProject(), logoUrl: "" }),
        ).to.be.revertedWith("ExternalProjectRegistry: logo url is empty");
      });

      it("should not add project with empty banner url", async () => {
        await expect(
          externalProjectRegistry.connect(USER1).addProject({ ...defaultProject(), bannerUrl: "" }),
        ).to.be.revertedWith("ExternalProjectRegistry: banner url is empty");
      });

      it("should not add project with empty contract addresses", async () => {
        await expect(
          externalProjectRegistry.connect(USER1).addProject({ ...defaultProject(), contractAddresses: [] }),
        ).to.be.revertedWith("ExternalProjectRegistry: at least one contract is required");
      });

      it("should not add project with empty role", async () => {
        await expect(
          externalProjectRegistry.connect(USER1).addProject({ ...defaultProject(), role: "" }),
        ).to.be.revertedWith("ExternalProjectRegistry: role is empty");
      });

      it("should add project with empty permissions", async () => {
        await expect(externalProjectRegistry.connect(USER1).addProject({ ...defaultProject(), permissions: [] })).to.be
          .not.reverted;
      });
    });
  });

  describe("#requestUpdateProject", () => {
    let projectId: string;

    beforeEach(async () => {
      projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      await externalProjectRegistry.connect(USER1).addProject(defaultProject());
    });

    it("should correctly request update external project", async () => {
      const updateParams = defaultUpdateParams(projectId);

      const acceptData = externalProjectRegistry.interface.encodeFunctionData("updateProject", [updateParams]);
      const registryAddress = await externalProjectRegistry.getAddress();

      const tx = externalProjectRegistry.connect(USER1).requestUpdateProject(updateParams);

      await expect(tx).to.emit(externalProjectRegistry, "UpdateProjectRequested").withArgs(projectId, FIRST_REQUEST_ID);

      await expect(tx)
        .to.emit(reviewableRequests, "RequestCreated")
        .withArgs(FIRST_REQUEST_ID, registryAddress, registryAddress, acceptData, "0x", DEFAULT_PROJECT_NAME, "");

      const request = await reviewableRequests.requests(FIRST_REQUEST_ID);

      expect(request.creator).to.be.equal(registryAddress);
      expect(request.acceptData).to.be.equal(acceptData);
      expect(request.misc).to.be.equal(DEFAULT_PROJECT_NAME);
    });

    it("should not request update external project from a non-owner", async () => {
      await masterAccess.addPermissionsToRole(DeterministicFactoryRole, [DETERMINISTIC_FACTORY_DEPLOY], true);
      await masterAccess.grantRoles(USER2, [DeterministicFactoryRole]);

      await expect(
        externalProjectRegistry.connect(USER2).requestUpdateProject(defaultUpdateParams(projectId)),
      ).to.be.revertedWith("ExternalProjectRegistry: caller is not the project owner");
    });

    it("should not request update external project without permission", async () => {
      await expect(
        externalProjectRegistry.connect(USER2).requestUpdateProject(defaultUpdateParams(projectId)),
      ).to.be.revertedWith("ExternalProjectRegistry: access denied");
    });

    it("should not request update for non-existing project", async () => {
      const fakeId = ethers.id("fake");
      await expect(
        externalProjectRegistry.connect(USER1).requestUpdateProject(defaultUpdateParams(fakeId)),
      ).to.be.revertedWith("ExternalProjectRegistry: project does not exist");
    });

    it("should not request update external project with same request", async () => {
      await externalProjectRegistry.connect(USER1).requestUpdateProject(defaultUpdateParams(projectId));

      await expect(
        externalProjectRegistry.connect(USER1).requestUpdateProject(defaultUpdateParams(projectId)),
      ).to.be.revertedWith("ExternalProjectRegistry: update request already exists");
    });
  });

  describe("#dropUpdateProjectRequest", () => {
    let projectId: string;

    beforeEach(async () => {
      projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      await externalProjectRegistry.connect(USER1).addProject(defaultProject());
    });

    it("should drop pending update external project request correctly", async () => {
      await externalProjectRegistry.connect(USER1).requestUpdateProject(defaultUpdateParams(projectId));

      await expect(externalProjectRegistry.connect(USER1).dropUpdateProjectRequest(projectId))
        .to.emit(externalProjectRegistry, "UpdateProjectRequestDropped")
        .withArgs(projectId, FIRST_REQUEST_ID);

      const request = await reviewableRequests.requests(FIRST_REQUEST_ID);

      expect(request.status).to.be.equal(RequestStatus.DROPPED);
    });

    it("should not drop update external project request without permission", async () => {
      await externalProjectRegistry.connect(USER1).requestUpdateProject(defaultUpdateParams(projectId));

      await expect(externalProjectRegistry.connect(USER2).dropUpdateProjectRequest(projectId)).to.be.revertedWith(
        "ExternalProjectRegistry: access denied",
      );
    });

    it("should not drop update external project request if it does not exist", async () => {
      await expect(externalProjectRegistry.connect(USER1).dropUpdateProjectRequest(projectId)).to.be.rejectedWith(
        "ExternalProjectRegistry: update request not found",
      );
    });
  });

  describe("#updateProject", () => {
    let projectId: string;

    beforeEach(async () => {
      projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      await externalProjectRegistry.connect(USER1).addProject(defaultProject());
    });

    it("should correctly update project info and emit event", async () => {
      const updateParams = defaultUpdateParams(projectId);

      const tx = await externalProjectRegistry.connect(USER1).updateProject(updateParams);
      await expect(tx)
        .to.emit(externalProjectRegistry, "ProjectUpdated")
        .withArgs(
          projectId,
          updateParams.owner,
          updateParams.contractAddressesToAdd,
          updateParams.logoUrl,
          updateParams.bannerUrl,
        );

      const project = await externalProjectRegistry.getProject(projectId);
      expect(project.owner).to.be.equal(updateParams.owner);
      expect(project.sourceCodeInfo).to.be.equal(updateParams.sourceCodeInfo);
      expect(project.contactInfo).to.be.equal(updateParams.contactInfo);
      expect(project.logoUrl).to.be.equal(updateParams.logoUrl);
      expect(project.bannerUrl).to.be.equal(updateParams.bannerUrl);
      expect(project.contractAddresses).to.be.deep.equal(updateParams.contractAddressesToAdd);
    });

    it("should update whitelisted contracts (remove old, add new)", async () => {
      expect(await whitelistedContractRegistry.isAllContractsWhitelisted(DEFAULT_CONTRACT_ADDRESSES)).to.be.true;
      expect(await whitelistedContractRegistry.isAllContractsWhitelisted(UPDATED_CONTRACT_ADDRESSES)).to.be.false;

      const updateParams = defaultUpdateParams(projectId);
      await externalProjectRegistry.connect(USER1).updateProject(updateParams);

      expect(await whitelistedContractRegistry.isAllContractsWhitelisted(DEFAULT_CONTRACT_ADDRESSES)).to.be.false;
      expect(await whitelistedContractRegistry.isAllContractsWhitelisted(UPDATED_CONTRACT_ADDRESSES)).to.be.true;
    });

    it("should add new permissions to role", async () => {
      const updateParams = defaultUpdateParams(projectId);
      const tx = await externalProjectRegistry.connect(USER1).updateProject(updateParams);

      await expect(tx)
        .to.emit(masterAccess, "AddedPermissions")
        .withArgs(DEFAULT_ROLE, NEW_PERMISSIONS[0].resource, NEW_PERMISSIONS[0].permissions, true);

      // Check if old permissions still exist
      const rolePermissions = (await masterAccess.getRolePermissions(DEFAULT_ROLE)).allowed_;
      const defaultPerm = rolePermissions.find((p) => p.resource === DEFAULT_PERMISSIONS[0].resource);
      const newPerm = rolePermissions.find((p) => p.resource === NEW_PERMISSIONS[0].resource);

      expect(defaultPerm).to.not.be.undefined;
      expect(newPerm).to.not.be.undefined;
    });

    it("should remove permissions from role", async () => {
      const updateParams = {
        ...defaultUpdateParams(projectId),
        permissionsToAdd: [],
        permissionsToRemove: DEFAULT_PERMISSIONS,
      };
      const tx = await externalProjectRegistry.connect(USER1).updateProject(updateParams);

      await expect(tx)
        .to.emit(masterAccess, "RemovedPermissions")
        .withArgs(DEFAULT_ROLE, DEFAULT_PERMISSIONS[0].resource, DEFAULT_PERMISSIONS[0].permissions, true);

      const rolePermissions = (await masterAccess.getRolePermissions(DEFAULT_ROLE)).allowed_;
      const defaultPerm = rolePermissions.find((p) => p.resource === DEFAULT_PERMISSIONS[0].resource);

      expect(defaultPerm).to.be.undefined;
    });

    it("should only add contracts without removing", async () => {
      const updateParams = {
        ...defaultUpdateParams(projectId),
        contractAddressesToRemove: [],
      };

      await externalProjectRegistry.connect(USER1).updateProject(updateParams);

      const project = await externalProjectRegistry.getProject(projectId);
      expect(project.contractAddresses.length).to.equal(
        DEFAULT_CONTRACT_ADDRESSES.length + UPDATED_CONTRACT_ADDRESSES.length,
      );
      expect(project.contractAddresses).to.include.members([
        ...DEFAULT_CONTRACT_ADDRESSES,
        ...UPDATED_CONTRACT_ADDRESSES,
      ]);
    });

    it("should only remove contracts without adding", async () => {
      const updateParams = {
        ...defaultUpdateParams(projectId),
        contractAddressesToAdd: [],
        contractAddressesToRemove: [DEFAULT_CONTRACT_ADDRESSES[0]],
      };

      await externalProjectRegistry.connect(USER1).updateProject(updateParams);

      const project = await externalProjectRegistry.getProject(projectId);
      expect(project.contractAddresses.length).to.equal(DEFAULT_CONTRACT_ADDRESSES.length - 1);
      expect(project.contractAddresses).to.not.include(DEFAULT_CONTRACT_ADDRESSES[0]);
      expect(project.contractAddresses).to.include(DEFAULT_CONTRACT_ADDRESSES[1]);
    });

    it("should clear update request info after updating project", async () => {
      const updateParams = defaultUpdateParams(projectId);

      await externalProjectRegistry.connect(USER1).requestUpdateProject(updateParams);

      const requestInfo = await externalProjectRegistry.getRequest(projectId);
      expect(requestInfo.exists).to.be.false;

      await reviewableRequests.connect(USER1).acceptRequest(FIRST_REQUEST_ID);

      await expect(externalProjectRegistry.connect(USER1).requestUpdateProject(updateParams)).to.not.be.revertedWith(
        "ExternalProjectRegistry: update request already exists",
      );
    });

    it("should not update project without permission", async () => {
      await expect(
        externalProjectRegistry.connect(USER2).updateProject(defaultUpdateParams(projectId)),
      ).to.be.revertedWith("ExternalProjectRegistry: access denied");
    });
  });

  describe("#validateUpdateParams", () => {
    let projectId: string;

    beforeEach(async () => {
      projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      await externalProjectRegistry.connect(USER1).addProject(defaultProject());
    });

    it("should revert if project does not exist", async () => {
      const fakeId = ethers.id("fake");
      await expect(externalProjectRegistry.validateUpdateParams(defaultUpdateParams(fakeId))).to.be.revertedWith(
        "ExternalProjectRegistry: project does not exist",
      );
    });

    it("should revert if owner is zero address", async () => {
      await expect(
        externalProjectRegistry.validateUpdateParams({ ...defaultUpdateParams(projectId), owner: ethers.ZeroAddress }),
      ).to.be.revertedWith("ExternalProjectRegistry: owner is empty");
    });

    it("should revert if source code info is empty", async () => {
      await expect(
        externalProjectRegistry.validateUpdateParams({ ...defaultUpdateParams(projectId), sourceCodeInfo: "" }),
      ).to.be.revertedWith("ExternalProjectRegistry: source code info is empty");
    });

    it("should revert if contact info is empty", async () => {
      await expect(
        externalProjectRegistry.validateUpdateParams({ ...defaultUpdateParams(projectId), contactInfo: "" }),
      ).to.be.revertedWith("ExternalProjectRegistry: contact info is empty");
    });

    it("should revert if logo url is empty", async () => {
      await expect(
        externalProjectRegistry.validateUpdateParams({ ...defaultUpdateParams(projectId), logoUrl: "" }),
      ).to.be.revertedWith("ExternalProjectRegistry: logo url is empty");
    });

    it("should revert if banner url is empty", async () => {
      await expect(
        externalProjectRegistry.validateUpdateParams({ ...defaultUpdateParams(projectId), bannerUrl: "" }),
      ).to.be.revertedWith("ExternalProjectRegistry: banner url is empty");
    });

    it("should revert if role is empty", async () => {
      await expect(
        externalProjectRegistry.validateUpdateParams({ ...defaultUpdateParams(projectId), role: "" }),
      ).to.be.revertedWith("ExternalProjectRegistry: role is empty");
    });

    it("should revert if role does not match existing project role", async () => {
      await expect(
        externalProjectRegistry.validateUpdateParams({ ...defaultUpdateParams(projectId), role: "DIFF_ROLE" }),
      ).to.be.revertedWith("ExternalProjectRegistry: role must match existing project role");
    });
  });

  describe("#getProjectId", () => {
    it("should correctly get project id", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);

      expect(projectId).to.be.equal(ethers.id(DEFAULT_PROJECT_NAME));
    });
  });

  describe("#validateProject", () => {
    it("should not validate project with zero address owner", async () => {
      await expect(
        externalProjectRegistry.validateProject({ ...defaultProject(), owner: ethers.ZeroAddress }),
      ).to.be.revertedWith("ExternalProjectRegistry: owner is empty");
    });

    it("should not validate project with empty name", async () => {
      await expect(externalProjectRegistry.validateProject({ ...defaultProject(), name: "" })).to.be.revertedWith(
        "ExternalProjectRegistry: project name is empty",
      );
    });

    it("should not validate project with empty source code info", async () => {
      await expect(
        externalProjectRegistry.validateProject({ ...defaultProject(), sourceCodeInfo: "" }),
      ).to.be.revertedWith("ExternalProjectRegistry: source code info is empty");
    });

    it("should not validate project with empty contact info", async () => {
      await expect(
        externalProjectRegistry.validateProject({ ...defaultProject(), contactInfo: "" }),
      ).to.be.revertedWith("ExternalProjectRegistry: contact info is empty");
    });

    it("should not validate project with empty logo url", async () => {
      await expect(externalProjectRegistry.validateProject({ ...defaultProject(), logoUrl: "" })).to.be.revertedWith(
        "ExternalProjectRegistry: logo url is empty",
      );
    });

    it("should not validate project with empty banner url", async () => {
      await expect(externalProjectRegistry.validateProject({ ...defaultProject(), bannerUrl: "" })).to.be.revertedWith(
        "ExternalProjectRegistry: banner url is empty",
      );
    });

    it("should not validate project with empty contract addresses", async () => {
      await expect(
        externalProjectRegistry.validateProject({ ...defaultProject(), contractAddresses: [] }),
      ).to.be.revertedWith("ExternalProjectRegistry: at least one contract is required");
    });

    it("should not validate project with empty role", async () => {
      await expect(externalProjectRegistry.validateProject({ ...defaultProject(), role: "" })).to.be.revertedWith(
        "ExternalProjectRegistry: role is empty",
      );
    });

    it("should validate project with empty permissions", async () => {
      await expect(externalProjectRegistry.validateProject({ ...defaultProject(), permissions: [] })).to.be.not
        .reverted;
    });
  });

  describe("#isRequestExists", () => {
    it("should return false if request does not exist", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      expect(await externalProjectRegistry.isRequestExists(projectId)).to.be.equal(false);
    });

    it("should return true if request exists", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      await externalProjectRegistry.connect(USER1).requestAddProject(defaultProject());
      expect(await externalProjectRegistry.isRequestExists(projectId)).to.be.equal(true);
    });
  });

  describe("#isProjectExists", () => {
    it("should correctly check if project exists", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);

      expect(await externalProjectRegistry.isProjectExists(projectId)).to.be.equal(false);

      await externalProjectRegistry.addProject(defaultProject());

      expect(await externalProjectRegistry.isProjectExists(projectId)).to.be.equal(true);
    });
  });

  describe("#getRequest", () => {
    it("should return request info correctly", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      const requestInfo = await externalProjectRegistry.getRequest(projectId);
      expect(requestInfo.exists).to.be.equal(false);
      expect(requestInfo.requestId).to.be.equal(0);
    });

    it("should return request info correctly if request exists", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      await externalProjectRegistry.connect(USER1).requestAddProject(defaultProject());
      const requestInfo = await externalProjectRegistry.getRequest(projectId);
      expect(requestInfo.exists).to.be.equal(true);
      expect(requestInfo.requestId).to.be.equal(FIRST_REQUEST_ID);
    });
  });

  describe("#getRequestStatus", () => {
    it("should return request info correctly", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);

      expect(await externalProjectRegistry.getRequestStatus(projectId)).to.be.equal(0);

      await externalProjectRegistry.connect(USER1).requestAddProject(defaultProject());

      expect(await externalProjectRegistry.getRequestStatus(projectId)).to.be.equal(1);

      await reviewableRequests.connect(USER1).acceptRequest(FIRST_REQUEST_ID);

      expect(await externalProjectRegistry.getRequestStatus(projectId)).to.be.equal(2);
    });

    it("should return request status info correctly for dropped request", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);

      await externalProjectRegistry.connect(USER1).requestAddProject(defaultProject());

      expect(await externalProjectRegistry.getRequestStatus(projectId)).to.be.equal(1);

      await externalProjectRegistry.dropAddProjectRequest(projectId);

      expect(await externalProjectRegistry.getRequestStatus(projectId)).to.be.equal(0);

      const request = await reviewableRequests.requests(FIRST_REQUEST_ID);
      expect(request.status).to.be.equal(RequestStatus.DROPPED);
    });
  });

  describe("#getProject", () => {
    it("should correctly get project", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      await externalProjectRegistry.addProject(defaultProject());
      const project = await externalProjectRegistry.getProject(projectId);

      compareProjects(project, defaultProject());
    });

    it("should return empty project if project does not exist", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      const project = await externalProjectRegistry.getProject(projectId);
      const emptyProject = {
        owner: ethers.ZeroAddress,
        name: "",
        sourceCodeInfo: "",
        contactInfo: "",
        logoUrl: "",
        bannerUrl: "",
        contractAddresses: [],
        role: "",
        permissions: [],
      };
      compareProjects(project, emptyProject);
    });
  });

  describe("#getProjectContractAddresses", () => {
    it("should correctly get project contract addresses", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      await externalProjectRegistry.addProject(defaultProject());
      const contractAddresses = await externalProjectRegistry.getProjectContractAddresses(projectId);
      expect(contractAddresses).to.be.deep.equal(defaultProject().contractAddresses);
    });
  });

  describe("#getProjectOwner", () => {
    it("should correctly get project owner", async () => {
      const projectId = await externalProjectRegistry.getProjectId(DEFAULT_PROJECT_NAME);
      const projectToAdd = defaultProject();

      expect(await externalProjectRegistry.getProjectOwner(projectId)).to.be.equal(ethers.ZeroAddress);
      await externalProjectRegistry.connect(USER1).addProject(projectToAdd);
      expect(await externalProjectRegistry.getProjectOwner(projectId)).to.be.equal(projectToAdd.owner);
    });
  });
});
