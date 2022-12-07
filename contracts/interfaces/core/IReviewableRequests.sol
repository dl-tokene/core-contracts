// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IReviewableRequests {
    enum RequestStatus {
        NONE,
        PENDING,
        ACCEPTED,
        REJECTED,
        DROPPED
    }

    struct Request {
        RequestStatus status;
        address creator;
        address executor;
        bytes acceptData;
        bytes rejectData;
        string misc;
    }

    event RequestCreated(
        uint256 requestId,
        address creator,
        address executor,
        bytes acceptData,
        bytes rejectData,
        string misc,
        string description
    );
    event RequestUpdated(
        uint256 requestId,
        uint256 newRequestId,
        address executor,
        bytes acceptData,
        bytes rejectData,
        string misc,
        string description
    );
    event RequestAccepted(uint256 requestId);
    event RequestRejected(uint256 requestId);
    event RequestDropped(uint256 requestId);

    function createRequest(
        address executor_,
        bytes calldata acceptData_,
        bytes calldata rejectData_,
        string calldata misc_,
        string calldata description_
    ) external;

    function dropRequest(uint256 requestId_) external;

    function updateRequest(
        uint256 requestId_,
        address executor_,
        bytes calldata acceptData_,
        bytes calldata rejectData_,
        string calldata misc_,
        string calldata description_
    ) external;

    function acceptRequest(uint256 requestId_) external;

    function rejectRequest(uint256 requestId_) external;
}
