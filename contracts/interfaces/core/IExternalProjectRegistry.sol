// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IRBAC} from "@solarity/solidity-lib/interfaces/access/IRBAC.sol";

import {ReviewableRequests} from "../../core/ReviewableRequests.sol";

interface IExternalProjectRegistry {
    /**
     * @notice The struct to store the request info.
     * @param exists Whether the request exists.
     * @param requestId The id of the request.
     */
    struct RequestInfo {
        bool exists;
        uint256 requestId;
    }

    /**
     * @notice The struct to store the external project info.
     * @param owner The owner of the external project.
     * @param name The name of the external project.
     * @param sourceCodeInfo The source code info of the external project.
     * @param contactInfo The contact info of the external project.
     * @param logoUrl The logo url of the external project.
     * @param bannerUrl The banner url of the external project.
     * @param contractAddresses The addresses of the contracts in the external project.
     * @param role The role of the external project.
     * @param permissions The permissions of the external project.
     */
    struct ExternalProject {
        address owner;
        string name;
        string sourceCodeInfo;
        string contactInfo;
        string logoUrl;
        string bannerUrl;
        address[] contractAddresses;
        string role;
        IRBAC.ResourceWithPermissions[] permissions;
    }

    /**
     * @notice The struct to store the project update parameters.
     * @param projectId The id of the project to update.
     * @param owner The new owner of the external project.
     * @param sourceCodeInfo The new source code info of the external project.
     * @param contactInfo The new contact info of the external project.
     * @param logoUrl The new logo url of the external project.
     * @param bannerUrl The new banner url of the external project.
     * @param contractAddressesToAdd The addresses of the contracts to add to the external project.
     * @param contractAddressesToRemove The addresses of the contracts to remove from the external project.
     * @param role The role of the external project (must match existing role).
     * @param permissionsToAdd The permissions to add to the role.
     * @param permissionsToRemove The permissions to remove from the role.
     */
    struct UpdateProjectParams {
        bytes32 projectId;
        address owner;
        string sourceCodeInfo;
        string contactInfo;
        string logoUrl;
        string bannerUrl;
        address[] contractAddressesToAdd;
        address[] contractAddressesToRemove;
        string role;
        IRBAC.ResourceWithPermissions[] permissionsToAdd;
        IRBAC.ResourceWithPermissions[] permissionsToRemove;
    }

    /**
     * @notice The event that gets emitted when the create external project request is created.
     * @param projectId The id of the project.
     * @param requestId The id of the new request.
     */
    event AddProjectRequested(bytes32 projectId, uint256 requestId);

    /**
     * @notice The event that gets emitted when the approve request is dropped.
     * @param projectId The id of the project.
     * @param requestId The id of the request.
     */
    event AddProjectRequestDropped(bytes32 projectId, uint256 requestId);

    /**
     * @notice The event that gets emitted when the update external project request is created.
     * @param projectId The id of the project.
     * @param requestId The id of the new request.
     */
    event UpdateProjectRequested(bytes32 projectId, uint256 requestId);

    /**
     * @notice The event that gets emitted when the update request is dropped.
     * @param projectId The id of the project.
     * @param requestId The id of the request.
     */
    event UpdateProjectRequestDropped(bytes32 projectId, uint256 requestId);

    /**
     * @notice The event that gets emitted when the project is added.
     * @param projectId The id of the project.
     * @param owner The owner of the project.
     * @param role The role of the project.
     * @param contractAddresses The addresses of the contracts in the project.
     * @param logoUrl The logo url of the project.
     * @param bannerUrl The banner url of the project.
     */
    event ProjectAdded(
        bytes32 projectId,
        address owner,
        string role,
        address[] contractAddresses,
        string logoUrl,
        string bannerUrl
    );

    /**
     * @notice The event that gets emitted when the project is updated.
     * @param projectId The id of the project.
     * @param owner The new owner of the project.
     * @param contractAddresses The new addresses of the contracts in the project.
     * @param logoUrl The new logo url of the project.
     * @param bannerUrl The new banner url of the project.
     */
    event ProjectUpdated(
        bytes32 projectId,
        address owner,
        address[] contractAddresses,
        string logoUrl,
        string bannerUrl
    );

    /**
     * @notice The function to request addition of an external project.
     * @param project_ The project to approve.
     */
    function requestAddProject(
        IExternalProjectRegistry.ExternalProject calldata project_
    ) external;

    /**
     * @notice The function to drop an add project request.
     * @param projectId_ The id of the project.
     */
    function dropAddProjectRequest(bytes32 projectId_) external;

    /**
     * @notice The function to drop an update project request.
     * @param projectId_ The id of the project.
     */
    function dropUpdateProjectRequest(bytes32 projectId_) external;

    /**
     * @notice The function to add a project.
     * @param project_ The project to add.
     */
    function addProject(ExternalProject calldata project_) external;

    /**
     * @notice The function to get the project id.
     * @param projectName_ The name of the project.
     * @return projectId The id of the project.
     */
    function getProjectId(string calldata projectName_) external pure returns (bytes32);

    /**
     * @notice The function to validate a project.
     * @param project_ The project to validate.
     */
    function validateProject(ExternalProject calldata project_) external pure;

    /**
     * @notice The function to check if a request exists.
     * @param projectId_ The id of the project.
     * @return true if the request exists, false otherwise.
     */
    function isRequestExists(bytes32 projectId_) external view returns (bool);

    /**
     * @notice The function to check if a project exists.
     * @param projectId_ The id of the project.
     * @return true if the project exists, false otherwise.
     */
    function isProjectExists(bytes32 projectId_) external view returns (bool);

    /**
     * @notice The function to get the request info.
     * @param projectId_ The hash of the request.
     * @return requestInfo The request info.
     */
    function getRequest(bytes32 projectId_) external view returns (RequestInfo memory);

    /**
     * @notice The function to get the request status.
     * @param projectId_ The hash of the request.
     * @return requestStatus The status of the request.
     */
    function getRequestStatus(
        bytes32 projectId_
    ) external view returns (ReviewableRequests.RequestStatus);

    /**
     * @notice The function to get a project.
     * @param projectId_ The id of the project.
     * @return project The project.
     */
    function getProject(bytes32 projectId_) external view returns (ExternalProject memory);

    /**
     * @notice The function to get the owner of a project.
     * @param projectId_ The id of the project.
     * @return owner The owner of the project.
     */
    function getProjectOwner(bytes32 projectId_) external view returns (address);

    /**
     * @notice The function to get the contract addresses of a project.
     * @param projectId_ The id of the project.
     * @return contractAddresses The contract addresses of the project.
     */
    function getProjectContractAddresses(
        bytes32 projectId_
    ) external view returns (address[] memory);

    /**
     * @notice The function to request update of an external project.
     * @param params_ The update parameters.
     */
    function requestUpdateProject(UpdateProjectParams calldata params_) external;

    /**
     * @notice The function to update a project.
     * @param params_ The update parameters.
     */
    function updateProject(UpdateProjectParams calldata params_) external;
}
