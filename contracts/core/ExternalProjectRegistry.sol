// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IRBAC} from "@solarity/solidity-lib/interfaces/access/IRBAC.sol";
import {AbstractDependant} from "@solarity/solidity-lib/contracts-registry/AbstractDependant.sol";
import {SetHelper} from "@solarity/solidity-lib/libs/arrays/SetHelper.sol";

import {ReviewableRequests, IReviewableRequests} from "./ReviewableRequests.sol";
import {MasterContractsRegistry} from "./MasterContractsRegistry.sol";

import {IMasterAccessManagement} from "../interfaces/core/IMasterAccessManagement.sol";
import {IExternalProjectRegistry} from "../interfaces/core/IExternalProjectRegistry.sol";
import {IWhitelistedContractRegistry} from "../interfaces/core/IWhitelistedContractRegistry.sol";

contract ExternalProjectRegistry is IExternalProjectRegistry, AbstractDependant {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SetHelper for EnumerableSet.AddressSet;

    IMasterAccessManagement internal _masterAccess;
    ReviewableRequests internal _reviewableRequests;
    IWhitelistedContractRegistry internal _whitelistedContractRegistry;

    mapping(bytes32 => RequestInfo) internal _requestInfo;
    mapping(bytes32 => RequestInfo) internal _updateRequestInfo;
    mapping(bytes32 => ExternalProject) internal _externalProjects;
    mapping(bytes32 => EnumerableSet.AddressSet) internal _projectContractAddresses;

    modifier onlyDeployerPermission() {
        require(
            _masterAccess.hasDeterministicFactoryDeployPermission(msg.sender),
            "ExternalProjectRegistry: access denied"
        );
        _;
    }

    modifier onlyCreatePermission() {
        require(
            _masterAccess.hasExternalProjectRegistryCreatePermission(msg.sender),
            "ExternalProjectRegistry: access denied"
        );
        _;
    }

    modifier onlyUpdatePermission() {
        require(
            _masterAccess.hasExternalProjectRegistryUpdatePermission(msg.sender),
            "ExternalProjectRegistry: access denied"
        );
        _;
    }

    function setDependencies(address registryAddress_, bytes memory) public override dependant {
        MasterContractsRegistry registry_ = MasterContractsRegistry(registryAddress_);
        _masterAccess = IMasterAccessManagement(registry_.getMasterAccessManagement());
        _whitelistedContractRegistry = IWhitelistedContractRegistry(
            registry_.getWhitelistedContractRegistry()
        );
        _reviewableRequests = ReviewableRequests(registry_.getReviewableRequests());
    }

    function requestAddProject(ExternalProject calldata project_) external onlyDeployerPermission {
        validateProject(project_);

        bytes32 projectId_ = getProjectId(project_.name);

        require(!isRequestExists(projectId_), "ExternalProjectRegistry: request already exists");

        uint256 requestId_ = _reviewableRequests.nextRequestId();

        bytes memory acceptData_ = abi.encodeWithSelector(this.addProject.selector, project_);

        _reviewableRequests.createRequest(address(this), acceptData_, "", project_.name, "");

        _requestInfo[projectId_] = RequestInfo({exists: true, requestId: requestId_});

        emit AddProjectRequested(projectId_, requestId_);
    }

    function dropAddProjectRequest(bytes32 projectId_) external onlyUpdatePermission {
        require(isRequestExists(projectId_), "ExternalProjectRegistry: request not found");

        uint256 requestId_ = _requestInfo[projectId_].requestId;

        _reviewableRequests.dropRequest(requestId_);

        delete _requestInfo[projectId_];

        emit AddProjectRequestDropped(projectId_, requestId_);
    }

    function dropUpdateProjectRequest(bytes32 projectId_) external onlyUpdatePermission {
        require(
            _updateRequestInfo[projectId_].exists,
            "ExternalProjectRegistry: update request not found"
        );

        uint256 requestId_ = _updateRequestInfo[projectId_].requestId;

        _reviewableRequests.dropRequest(requestId_);

        delete _updateRequestInfo[projectId_];

        emit UpdateProjectRequestDropped(projectId_, requestId_);
    }

    function addProject(ExternalProject calldata project_) external onlyCreatePermission {
        validateProject(project_);

        bytes32 projectId_ = getProjectId(project_.name);
        require(
            !isProjectExists(projectId_),
            "ExternalProjectRegistry: project with this name already exists"
        );

        _setProject(projectId_, project_);

        _whitelistedContractRegistry.addWhitelistedContracts(project_.contractAddresses);

        _masterAccess.addPermissionsToRole(project_.role, project_.permissions, true);

        emit ProjectAdded(
            projectId_,
            project_.owner,
            project_.role,
            project_.contractAddresses,
            project_.logoUrl,
            project_.bannerUrl
        );
    }

    function requestUpdateProject(
        UpdateProjectParams calldata params_
    ) external onlyDeployerPermission {
        validateUpdateParams(params_);

        bytes32 projectId_ = params_.projectId;

        require(
            !_updateRequestInfo[projectId_].exists,
            "ExternalProjectRegistry: update request already exists"
        );

        require(
            _externalProjects[projectId_].owner == msg.sender,
            "ExternalProjectRegistry: caller is not the project owner"
        );

        uint256 requestId_ = _reviewableRequests.nextRequestId();

        bytes memory acceptData_ = abi.encodeWithSelector(this.updateProject.selector, params_);

        _reviewableRequests.createRequest(
            address(this),
            acceptData_,
            "",
            _externalProjects[projectId_].name,
            ""
        );

        _updateRequestInfo[projectId_] = RequestInfo({exists: true, requestId: requestId_});

        emit UpdateProjectRequested(projectId_, requestId_);
    }

    function updateProject(UpdateProjectParams calldata params_) external onlyUpdatePermission {
        validateUpdateParams(params_);

        bytes32 projectId_ = params_.projectId;
        ExternalProject storage project = _externalProjects[projectId_];

        if (params_.contractAddressesToRemove.length > 0) {
            _whitelistedContractRegistry.removeWhitelistedContracts(
                params_.contractAddressesToRemove
            );
            _projectContractAddresses[projectId_].remove(params_.contractAddressesToRemove);
        }

        if (params_.contractAddressesToAdd.length > 0) {
            _whitelistedContractRegistry.addWhitelistedContracts(params_.contractAddressesToAdd);
            _projectContractAddresses[projectId_].add(params_.contractAddressesToAdd);
        }

        project.owner = params_.owner;
        project.sourceCodeInfo = params_.sourceCodeInfo;
        project.contactInfo = params_.contactInfo;
        project.logoUrl = params_.logoUrl;
        project.bannerUrl = params_.bannerUrl;

        if (params_.permissionsToRemove.length > 0) {
            _masterAccess.removePermissionsFromRole(
                params_.role,
                params_.permissionsToRemove,
                true
            );
        }

        if (params_.permissionsToAdd.length > 0) {
            _masterAccess.addPermissionsToRole(params_.role, params_.permissionsToAdd, true);
        }

        delete _updateRequestInfo[projectId_];

        emit ProjectUpdated(
            projectId_,
            params_.owner,
            _projectContractAddresses[projectId_].values(),
            params_.logoUrl,
            params_.bannerUrl
        );
    }

    function _setProject(bytes32 projectId_, ExternalProject calldata project_) internal {
        ExternalProject storage project = _externalProjects[projectId_];

        project.owner = project_.owner;
        project.name = project_.name;
        project.sourceCodeInfo = project_.sourceCodeInfo;
        project.contactInfo = project_.contactInfo;
        project.logoUrl = project_.logoUrl;
        project.bannerUrl = project_.bannerUrl;
        project.role = project_.role;

        _projectContractAddresses[projectId_].add(project_.contractAddresses);

        for (uint256 i = 0; i < project_.permissions.length; i++) {
            IRBAC.ResourceWithPermissions storage permission = project.permissions.push();
            IRBAC.ResourceWithPermissions calldata permissionToAdd_ = project_.permissions[i];

            permission.resource = permissionToAdd_.resource;
            for (uint256 j = 0; j < permissionToAdd_.permissions.length; j++) {
                permission.permissions.push(permissionToAdd_.permissions[j]);
            }
        }
    }

    function getProjectId(string calldata projectName_) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(projectName_));
    }

    function validateProject(ExternalProject calldata project_) public pure {
        require(project_.owner != address(0), "ExternalProjectRegistry: owner is empty");
        require(bytes(project_.name).length > 0, "ExternalProjectRegistry: project name is empty");
        require(
            bytes(project_.sourceCodeInfo).length > 0,
            "ExternalProjectRegistry: source code info is empty"
        );
        require(
            bytes(project_.contactInfo).length > 0,
            "ExternalProjectRegistry: contact info is empty"
        );
        require(bytes(project_.logoUrl).length > 0, "ExternalProjectRegistry: logo url is empty");
        require(
            bytes(project_.bannerUrl).length > 0,
            "ExternalProjectRegistry: banner url is empty"
        );
        require(
            project_.contractAddresses.length > 0,
            "ExternalProjectRegistry: at least one contract is required"
        );
        require(bytes(project_.role).length > 0, "ExternalProjectRegistry: role is empty");
    }

    function validateUpdateParams(UpdateProjectParams calldata params_) public view {
        require(
            isProjectExists(params_.projectId),
            "ExternalProjectRegistry: project does not exist"
        );
        require(params_.owner != address(0), "ExternalProjectRegistry: owner is empty");
        require(
            bytes(params_.sourceCodeInfo).length > 0,
            "ExternalProjectRegistry: source code info is empty"
        );
        require(
            bytes(params_.contactInfo).length > 0,
            "ExternalProjectRegistry: contact info is empty"
        );
        require(bytes(params_.logoUrl).length > 0, "ExternalProjectRegistry: logo url is empty");
        require(
            bytes(params_.bannerUrl).length > 0,
            "ExternalProjectRegistry: banner url is empty"
        );
        require(bytes(params_.role).length > 0, "ExternalProjectRegistry: role is empty");
        require(
            keccak256(abi.encodePacked(params_.role)) ==
                keccak256(abi.encodePacked(_externalProjects[params_.projectId].role)),
            "ExternalProjectRegistry: role must match existing project role"
        );
    }

    function isRequestExists(bytes32 projectId_) public view returns (bool) {
        return _requestInfo[projectId_].exists;
    }

    function getRequest(bytes32 projectId_) public view returns (RequestInfo memory) {
        return _requestInfo[projectId_];
    }

    function getRequestStatus(
        bytes32 projectId_
    ) external view returns (ReviewableRequests.RequestStatus requestStatus_) {
        if (!isRequestExists(projectId_)) return IReviewableRequests.RequestStatus.NONE;

        (requestStatus_, , , , , ) = _reviewableRequests.requests(
            _requestInfo[projectId_].requestId
        );
    }

    function isProjectExists(bytes32 projectId_) public view returns (bool) {
        return _externalProjects[projectId_].owner != address(0);
    }

    function getProject(bytes32 projectId_) external view returns (ExternalProject memory) {
        ExternalProject memory project = _externalProjects[projectId_];
        project.contractAddresses = _projectContractAddresses[projectId_].values();
        return project;
    }

    function getProjectContractAddresses(
        bytes32 projectId_
    ) external view returns (address[] memory) {
        return _projectContractAddresses[projectId_].values();
    }

    function getProjectOwner(bytes32 projectId_) external view returns (address) {
        return _externalProjects[projectId_].owner;
    }
}
