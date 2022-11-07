// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";

import "../interfaces/core/IMasterAccessManagement.sol";
import "../interfaces/core/IMasterContractsRegistry.sol";
import "../interfaces/core/IReviewableRequests.sol";

contract ReviewableRequests is IReviewableRequests, AbstractDependant {
    IMasterAccessManagement internal _masterAccess;

    uint256 public nextRequestId;

    mapping(uint256 => Request) public requests;

    modifier onlyCreatePermission() {
        require(
            _masterAccess.hasReviewableRequestsCreatePermission(msg.sender),
            "ReviewableRequests: access denied"
        );
        _;
    }

    modifier onlyExecutePermission() {
        require(
            _masterAccess.hasReviewableRequestsExecutePermission(msg.sender),
            "ReviewableRequests: access denied"
        );
        _;
    }

    modifier onlyDeletePermission() {
        require(
            _masterAccess.hasReviewableRequestsDeletePermission(msg.sender),
            "ReviewableRequests: access denied"
        );
        _;
    }

    function setDependencies(address registryAddress_) external override dependant {
        IMasterContractsRegistry registry_ = IMasterContractsRegistry(registryAddress_);
        _masterAccess = IMasterAccessManagement(registry_.getMasterAccessManagement());
    }

    function createRequest(
        address executor_,
        bytes calldata acceptData_,
        bytes calldata rejectData_,
        string calldata description_
    ) external override onlyCreatePermission {
        _createRequest(executor_, acceptData_, rejectData_);

        emit RequestCreated(
            nextRequestId - 1,
            msg.sender,
            executor_,
            acceptData_,
            rejectData_,
            description_
        );
    }

    function dropRequest(uint256 requestId_) external override onlyDeletePermission {
        _dropRequest(requestId_);

        emit RequestDropped(requestId_);
    }

    function updateRequest(
        uint256 requestId_,
        address executor_,
        bytes calldata acceptData_,
        bytes calldata rejectData_,
        string calldata description_
    ) external override onlyCreatePermission onlyDeletePermission {
        _dropRequest(requestId_);
        _createRequest(executor_, acceptData_, rejectData_);

        emit RequestUpdated(
            requestId_,
            nextRequestId - 1,
            executor_,
            acceptData_,
            rejectData_,
            description_
        );
    }

    function acceptRequest(uint256 requestId_) external override onlyExecutePermission {
        Request storage request_ = _getPendingRequest(requestId_);

        request_.status = RequestStatus.ACCEPTED;

        if (request_.acceptData.length > 0) {
            (bool success_, ) = request_.executor.call(request_.acceptData);
            require(success_, "ReviewableRequests: failed to accept request");
        }

        emit RequestAccepted(requestId_);
    }

    function rejectRequest(uint256 requestId_) external override onlyExecutePermission {
        Request storage request_ = _getPendingRequest(requestId_);

        request_.status = RequestStatus.REJECTED;

        if (request_.rejectData.length > 0) {
            (bool success_, ) = request_.executor.call(request_.rejectData);
            require(success_, "ReviewableRequests: failed to reject request");
        }

        emit RequestRejected(requestId_);
    }

    function _getPendingRequest(
        uint256 requestId_
    ) internal view returns (Request storage request_) {
        request_ = requests[requestId_];

        require(
            request_.status == RequestStatus.PENDING,
            "ReviewableRequests: invalid request status"
        );
    }

    function _createRequest(
        address executor_,
        bytes calldata acceptData_,
        bytes calldata rejectData_
    ) internal {
        require(executor_ != address(0), "ReviewableRequests: zero executor");

        requests[nextRequestId++] = Request({
            status: RequestStatus.PENDING,
            creator: msg.sender,
            executor: executor_,
            acceptData: acceptData_,
            rejectData: rejectData_
        });
    }

    function _dropRequest(uint256 requestId_) internal {
        Request storage request_ = _getPendingRequest(requestId_);

        require(request_.creator == msg.sender, "ReviewableRequests: not a request creator");

        request_.status = RequestStatus.DROPPED;
    }
}
