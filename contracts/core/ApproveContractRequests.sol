// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {AbstractDependant} from "@solarity/solidity-lib/contracts-registry/AbstractDependant.sol";

import {MasterContractsRegistry} from "./MasterContractsRegistry.sol";
import {MasterAccessManagement} from "./MasterAccessManagement.sol";
import {ReviewableRequests, IReviewableRequests} from "./ReviewableRequests.sol";

import {IApproveContractRequests} from "../interfaces/core/IApproveContractRequests.sol";
import {IWhitelistedContractRegistry} from "../interfaces/core/IWhitelistedContractRegistry.sol";

/**
 * @notice The ApproveContractRequests contract. It is used to forward user incentives to add contracts to the whitelist.
 */
contract ApproveContractRequests is IApproveContractRequests, AbstractDependant {
    using Strings for uint256;

    MasterAccessManagement internal _masterAccess;
    ReviewableRequests internal _reviewableRequests;
    IWhitelistedContractRegistry internal _whitelistedContractRegistry;

    mapping(bytes32 => RequestInfo) internal _requestInfo;

    modifier onlyUpdatePermission() {
        require(
            _masterAccess.hasApproveContractRequestsUpdatePermission(msg.sender),
            "ApproveContractRequests: access denied"
        );
        _;
    }

    function setDependencies(address registryAddress_, bytes memory) public override dependant {
        MasterContractsRegistry registry_ = MasterContractsRegistry(registryAddress_);
        _masterAccess = MasterAccessManagement(registry_.getMasterAccessManagement());
        _reviewableRequests = ReviewableRequests(registry_.getReviewableRequests());
        _whitelistedContractRegistry = IWhitelistedContractRegistry(
            registry_.getWhitelistedContractRegistry()
        );
    }

    function requestApproveContract(
        address[] calldata contractAddresses_,
        string calldata sourceCodeInfo_,
        string calldata contactInfo_
    ) external {
        require(
            contractAddresses_.length > 0,
            "ApproveContractRequests: at least one contract address is required"
        );
        require(
            bytes(sourceCodeInfo_).length > 0,
            "ApproveContractRequests: source code info is required"
        );
        require(
            bytes(contactInfo_).length > 0,
            "ApproveContractRequests: contact info is required"
        );

        bytes32 requestHash_ = getRequestHash(contractAddresses_);

        require(!isRequestExists(requestHash_), "ApproveContractRequests: request already exists");

        uint256 newRequestId_ = _reviewableRequests.nextRequestId();

        bytes memory acceptData_ = abi.encodeWithSelector(
            _whitelistedContractRegistry.addWhitelistedContracts.selector,
            contractAddresses_
        );

        string memory misc_ = string(
            abi.encodePacked(
                uint256(uint160(msg.sender)).toHexString(20),
                "\n",
                sourceCodeInfo_,
                "\n",
                contactInfo_
            )
        );

        _reviewableRequests.createRequest(
            address(_whitelistedContractRegistry),
            acceptData_,
            "",
            misc_,
            ""
        );

        _requestInfo[requestHash_] = RequestInfo({
            requestId: newRequestId_,
            contractAddresses: contractAddresses_,
            sourceCodeInfo: sourceCodeInfo_,
            contactInfo: contactInfo_
        });

        emit ApproveRequested(
            contractAddresses_,
            sourceCodeInfo_,
            contactInfo_,
            requestHash_,
            newRequestId_
        );
    }

    function dropApproveRequest(bytes32 requestHash_) external onlyUpdatePermission {
        require(isRequestExists(requestHash_), "ApproveContractRequests: request not found");

        uint256 requestId_ = _requestInfo[requestHash_].requestId;

        _reviewableRequests.dropRequest(requestId_);

        emit ReviewableRequestDropped(requestHash_, requestId_);
    }

    function getRequestInfo(bytes32 requestHash_) external view returns (RequestInfoView memory) {
        (
            ReviewableRequests.RequestStatus requestStatus_,
            ,
            ,
            ,
            ,
            string memory misc_
        ) = _reviewableRequests.requests(_requestInfo[requestHash_].requestId);

        RequestInfo memory requestInfo_ = _requestInfo[requestHash_];

        return
            RequestInfoView({
                requestId: requestInfo_.requestId,
                contractAddresses: requestInfo_.contractAddresses,
                sourceCodeInfo: requestInfo_.sourceCodeInfo,
                contactInfo: requestInfo_.contactInfo,
                requestStatus: requestStatus_,
                misc: misc_
            });
    }

    function getRequestStatus(
        bytes32 requestHash_
    ) external view returns (ReviewableRequests.RequestStatus requestStatus_) {
        if (!isRequestExists(requestHash_)) return IReviewableRequests.RequestStatus.NONE;

        (requestStatus_, , , , , ) = _reviewableRequests.requests(
            _requestInfo[requestHash_].requestId
        );
    }

    function getRequestHash(address[] calldata contractAddresses_) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(contractAddresses_));
    }

    function isRequestExists(bytes32 requestHash_) public view returns (bool) {
        return _requestInfo[requestHash_].contractAddresses.length > 0;
    }
}
