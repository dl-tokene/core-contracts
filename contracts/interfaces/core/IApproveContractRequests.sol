// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ReviewableRequests} from "../../core/ReviewableRequests.sol";

interface IApproveContractRequests {
    /**
     * @notice The struct to store the request info.
     * @param requestId The id of the request.
     * @param contractAddresses The addresses of the contracts to approve.
     * @param sourceCodeInfo The source code info of the contracts.
     * @param contactInfo The contact info.
     */
    struct RequestInfo {
        uint256 requestId;
        address[] contractAddresses;
        string sourceCodeInfo;
        string contactInfo;
    }

    /**
     * @notice The struct to store the request info view.
     * @param requestId The id of the request.
     * @param contractAddresses The addresses of the contracts to approve.
     * @param sourceCodeInfo The source code info of the contracts.
     * @param contactInfo The contact info.
     * @param requestStatus The status of the request.
     * @param misc The misc info of the request.
     */
    struct RequestInfoView {
        uint256 requestId;
        address[] contractAddresses;
        string sourceCodeInfo;
        string contactInfo;
        ReviewableRequests.RequestStatus requestStatus;
        string misc;
    }

    /**
     * @notice The event that gets emitted when the approve request is created.
     * @param contractAddresses The addresses of the contracts to approve.
     * @param sourceCodeInfos The source code infos of the contracts.
     * @param contactInfos The contact infos of the contracts.
     * @param requestHash The hash of the request.
     * @param newRequestId The id of the new request.
     */
    event ApproveRequested(
        address[] contractAddresses,
        string sourceCodeInfos,
        string contactInfos,
        bytes32 requestHash,
        uint256 newRequestId
    );

    /**
     * @notice The event that gets emitted when the approve request is dropped.
     * @param requestHash The hash of the request.
     * @param requestId The id of the request.
     */
    event ReviewableRequestDropped(bytes32 requestHash, uint256 requestId);

    /**
     * @notice The function to request approval for a contract.
     * @param contractAddresses_ The contracts to approve.
     * @param sourceCodeInfos_ The source code infos of the contracts.
     * @param contactInfos_ The contact infos of the contracts.
     */
    function requestApproveContract(
        address[] calldata contractAddresses_,
        string calldata sourceCodeInfos_,
        string calldata contactInfos_
    ) external;

    /**
     * @notice The function to drop an approval request.
     * @param requestHash_ The hash of the request.
     */
    function dropApproveRequest(bytes32 requestHash_) external;

    /**
     * @notice The function to get the request hash.
     * @param contractAddresses_ The contracts to approve.
     * @return requestHash The hash of the request.
     */
    function getRequestHash(address[] calldata contractAddresses_) external pure returns (bytes32);

    /**
     * @notice The function to get the request info.
     * @param requestHash_ The hash of the request.
     * @return requestInfo The request info.
     */
    function getRequestInfo(bytes32 requestHash_) external view returns (RequestInfoView memory);

    /**
     * @notice The function to get the request status.
     * @param requestHash_ The hash of the request.
     * @return requestStatus_ The request status.
     */
    function getRequestStatus(
        bytes32 requestHash_
    ) external view returns (ReviewableRequests.RequestStatus requestStatus_);

    /**
     * @notice The function to check if a request exists.
     * @param requestHash_ The hash of the request.
     * @return true if the request exists, false otherwise.
     */
    function isRequestExists(bytes32 requestHash_) external view returns (bool);
}
