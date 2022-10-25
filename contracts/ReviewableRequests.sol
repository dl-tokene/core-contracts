// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";

import "./interfaces/IMasterAccessManagement.sol";
import "./interfaces/IMasterContractsRegistry.sol";
import "./interfaces/IReviewableRequests.sol";

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
        require(executor_ != address(0), "ReviewableRequests: zero executor");

        uint256 requestId_ = nextRequestId++;

        requests[requestId_] = Request({
            status: RequestStatus.PENDING,
            creator: msg.sender,
            executor: executor_,
            acceptData: acceptData_,
            rejectData: rejectData_
        });

        emit RequestCreated(
            requestId_,
            msg.sender,
            executor_,
            acceptData_,
            rejectData_,
            description_
        );
    }

    function updateRequest(
        uint256 requestId_,
        address executor_,
        bytes calldata acceptData_,
        bytes calldata rejectData_,
        string calldata description_
    ) external override onlyCreatePermission onlyDeletePermission {
        dropRequest(requestId_);

        uint256 newRequestId_ = nextRequestId++;

        Request storage request_ = requests[requestId_];
        Request storage newRequest_ = requests[newRequestId_];

        newRequest_.status = RequestStatus.PENDING;
        newRequest_.creator = msg.sender;

        newRequest_.executor = executor_ == address(0) ? request_.executor : executor_;

        if (acceptData_.length == 0) {
            newRequest_.acceptData = request_.acceptData;
        } else {
            newRequest_.acceptData = acceptData_;
        }

        if (rejectData_.length == 0) {
            newRequest_.rejectData = request_.rejectData;
        } else {
            newRequest_.rejectData = rejectData_;
        }

        emit RequestUpdated(
            requestId_,
            newRequestId_,
            executor_,
            acceptData_,
            rejectData_,
            description_
        );
    }

    function dropRequest(uint256 requestId_) public override onlyDeletePermission {
        Request storage request_ = _getPendingRequest(requestId_);

        require(request_.creator == msg.sender, "ReviewableRequests: not a request creator");

        request_.status = RequestStatus.DROPPED;

        emit RequestDropped(requestId_);
    }

    function acceptRequest(uint256 requestId_) external override onlyExecutePermission {
        Request storage request_ = _getPendingRequest(requestId_);

        request_.status = RequestStatus.ACCEPTED;

        (bool success_, ) = request_.executor.call(request_.acceptData);
        require(success_, "ReviewableRequests: failed to accept request");

        emit RequestAccepted(requestId_);
    }

    function rejectRequest(uint256 requestId_) external override onlyExecutePermission {
        Request storage request_ = _getPendingRequest(requestId_);

        request_.status = RequestStatus.REJECTED;

        (bool success_, ) = request_.executor.call(request_.rejectData);
        require(success_, "ReviewableRequests: failed to reject request");

        emit RequestRejected(requestId_);
    }

    function _getPendingRequest(uint256 requestId_)
        internal
        view
        returns (Request storage request_)
    {
        request_ = requests[requestId_];

        require(
            request_.status == RequestStatus.PENDING,
            "ReviewableRequests: invalid request status"
        );
    }
}
