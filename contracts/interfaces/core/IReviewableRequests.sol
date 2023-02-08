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

    /**
     * @notice The event that gets emitted when the request is created
     * @param requestId the id of the request
     * @param creator the msg.sender of the function
     * @param executor the request executor
     * @param acceptData the data the executor will be called with if the request passes
     * @param rejectData the data the executor will be called with if the request fails
     * @param misc arbitrary data to be used on the FE
     * @param description the request description
     */
    event RequestCreated(
        uint256 requestId,
        address creator,
        address executor,
        bytes acceptData,
        bytes rejectData,
        string misc,
        string description
    );
    /**
     * @notice The event that gets emitted when the request is updated
     * @param requestId the id of the original request
     * @param newRequestId the id of the new request
     * @param executor the new request executor
     * @param acceptData the data the executor will be called with if the new request passes
     * @param rejectData the data the executor will be called with if the new request fails
     * @param misc arbitrary data to be used on the FE
     * @param description the new request description
     */
    event RequestUpdated(
        uint256 requestId,
        uint256 newRequestId,
        address executor,
        bytes acceptData,
        bytes rejectData,
        string misc,
        string description
    );
    /**
     * @notice The event that gets emitted when the request is accepted
     * @param requestId the accepted request id
     */
    event RequestAccepted(uint256 requestId);
    /**
     * @notice The event that gets emitted when the request is rejected
     * @param requestId the rejected request id
     * @param reason the rejected reason
     */
    event RequestRejected(uint256 requestId, string reason);
    /**
     * @notice The event that gets emitted when the request is dropped
     * @param requestId the dropped request id
     */
    event RequestDropped(uint256 requestId);

    /**
     * @notice The function to create a reviewable request
     * @dev Access: CREATE permission
     * @param executor_ the request executor contract
     * @param acceptData_ the data the executor_ will be called with if the request passes
     * @param rejectData_ the data the executor_ will be called with if the request fails
     * @param misc_ arbitrary data that may be useful for the FE
     * @param description_ the request description
     */
    function createRequest(
        address executor_,
        bytes calldata acceptData_,
        bytes calldata rejectData_,
        string calldata misc_,
        string calldata description_
    ) external;

    /**
     * @notice The function to drop the existing request
     * @dev Access: DELETE permission
     * @param requestId_ the request to drop
     */
    function dropRequest(uint256 requestId_) external;

    /**
     * @notice The function to update the existing request.
     * Drops the old and creates the new one to disable the possibility of frontrunning
     * @dev Access: DELETE and CREATE permissions
     * @param executor_ the request executor contract
     * @param acceptData_ the data the executor_ will be called with if the new request passes
     * @param rejectData_ the data the executor_ will be called with if the new request fails
     * @param misc_ arbitrary data that may be useful for the FE
     * @param description_ the new request description
     */
    function updateRequest(
        uint256 requestId_,
        address executor_,
        bytes calldata acceptData_,
        bytes calldata rejectData_,
        string calldata misc_,
        string calldata description_
    ) external;

    /**
     * @notice The admin function to accept the request
     * @dev Access: EXECUTE permission
     * @param requestId_ the request to accept
     */
    function acceptRequest(uint256 requestId_) external;

    /**
     * @notice The admin function to reject the request
     * @dev Access: EXECUTE permission
     * @param requestId_ the request to reject
     * @param reason_ the reject reason
     */
    function rejectRequest(uint256 requestId_, string calldata reason_) external;
}
