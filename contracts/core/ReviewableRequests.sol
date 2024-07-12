// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {AbstractDependant} from "@solarity/solidity-lib/contracts-registry/AbstractDependant.sol";

import {IMasterAccessManagement} from "../interfaces/core/IMasterAccessManagement.sol";
import {IMasterContractsRegistry} from "../interfaces/core/IMasterContractsRegistry.sol";
import {IReviewableRequests} from "../interfaces/core/IReviewableRequests.sol";

/**
 * @notice The ReviewableRequests contract. Its main purpose is to forward certian user incentives to change
 * platform settings to an admin for an approval.
 *
 * The TokenE modules may integrate with this contract to issue tokens, pass KYC and upload other requests that
 * require admin attention.
 */
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

    /**
     * @notice The function to set the required dependencies
     * @dev Access: the injector address
     * @param registryAddress_ the address of the ContractsRegistry
     */
    function setDependencies(address registryAddress_, bytes memory) public override dependant {
        IMasterContractsRegistry registry_ = IMasterContractsRegistry(registryAddress_);
        _masterAccess = IMasterAccessManagement(registry_.getMasterAccessManagement());
    }

    /**
     * @inheritdoc IReviewableRequests
     */
    function createRequest(
        address executor_,
        bytes calldata acceptData_,
        bytes calldata rejectData_,
        string calldata misc_,
        string calldata description_
    ) external override onlyCreatePermission {
        _createRequest(executor_, acceptData_, rejectData_, misc_);

        emit RequestCreated(
            nextRequestId - 1,
            msg.sender,
            executor_,
            acceptData_,
            rejectData_,
            misc_,
            description_
        );
    }

    /**
     * @inheritdoc IReviewableRequests
     */
    function dropRequest(uint256 requestId_) external override onlyDeletePermission {
        _dropRequest(requestId_);

        emit RequestDropped(requestId_);
    }

    function updateRequest(
        uint256 requestId_,
        address executor_,
        bytes calldata acceptData_,
        bytes calldata rejectData_,
        string calldata misc_,
        string calldata description_
    ) external override onlyCreatePermission onlyDeletePermission {
        _dropRequest(requestId_);
        _createRequest(executor_, acceptData_, rejectData_, misc_);

        emit RequestUpdated(
            requestId_,
            nextRequestId - 1,
            executor_,
            acceptData_,
            rejectData_,
            misc_,
            description_
        );
    }

    /**
     * @inheritdoc IReviewableRequests
     */
    function acceptRequest(uint256 requestId_) external override onlyExecutePermission {
        Request storage request_ = _getPendingRequest(requestId_);

        request_.status = RequestStatus.ACCEPTED;

        if (request_.acceptData.length > 0) {
            (bool success_, ) = request_.executor.call(request_.acceptData);
            require(success_, "ReviewableRequests: failed to accept request");
        }

        emit RequestAccepted(requestId_);
    }

    /**
     * @inheritdoc IReviewableRequests
     */
    function rejectRequest(
        uint256 requestId_,
        string calldata reason_
    ) external override onlyExecutePermission {
        Request storage request_ = _getPendingRequest(requestId_);

        request_.status = RequestStatus.REJECTED;

        if (request_.rejectData.length > 0) {
            (bool success_, ) = request_.executor.call(request_.rejectData);
            require(success_, "ReviewableRequests: failed to reject request");
        }

        emit RequestRejected(requestId_, reason_);
    }

    /**
     * @notice The internal function to check if the request is pending
     */
    function _getPendingRequest(
        uint256 requestId_
    ) internal view returns (Request storage request_) {
        request_ = requests[requestId_];

        require(
            request_.status == RequestStatus.PENDING,
            "ReviewableRequests: invalid request status"
        );
    }

    /**
     * @notice The internal function to create a request
     */
    function _createRequest(
        address executor_,
        bytes calldata acceptData_,
        bytes calldata rejectData_,
        string calldata misc_
    ) internal {
        require(executor_ != address(0), "ReviewableRequests: zero executor");

        requests[nextRequestId++] = Request({
            status: RequestStatus.PENDING,
            creator: msg.sender,
            executor: executor_,
            acceptData: acceptData_,
            rejectData: rejectData_,
            misc: misc_
        });
    }

    /**
     * @notice The internal function to drop a request
     */
    function _dropRequest(uint256 requestId_) internal {
        Request storage request_ = _getPendingRequest(requestId_);

        require(request_.creator == msg.sender, "ReviewableRequests: not a request creator");

        request_.status = RequestStatus.DROPPED;
    }
}
