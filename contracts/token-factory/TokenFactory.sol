// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";
import "../interfaces/IMasterRoleManagement.sol";
import "../interfaces/IMasterContractsRegistry.sol";
import "./ITokenFactory.sol";
import "./ERC20Initial.sol";

contract TokenFactoryRequestable is AbstractDependant, ITokenFactory {
    IMasterRoleManagement public masterRoles;

    uint256 public currentId;
    mapping(uint256 => DeploymentRequestERC20) public erc20Requests;
    // todo 2 more mappings for erc721 and erc115 but with same id

    event ERC20Deployed(address token_);

    function setDependencies(address registryAddress_) external virtual override dependant {
        IMasterContractsRegistry registry_ = IMasterContractsRegistry(registryAddress_);
        masterRoles = IMasterRoleManagement(registry_.getMasterRoleManagement());
    }

    modifier onlyDeployer() {
        require(
            masterRoles.hasTokenFactoryAdminRole(msg.sender),
            "TokenFactoryRequestable: not a TOKEN_FACTORY_ADMIN"
        );
        _;
    }

    function deployERC20AsAdmin(ERC20InitialParameters calldata params_)
        external
        onlyDeployer
        returns (address)
    {
        address token_ = address(
            new ERC20Initial(params_.initHolder, params_.initSupply, params_.name, params_.symbol)
        );

        emit ERC20Deployed(token_);
        return token_;
    }

    function deployERC20(uint256 id_) external returns (address) {
        BaseDeploymentParams storage deploymentParams = erc20Requests[id_].deploymentParams;

        require(
            deploymentParams.requester == msg.sender,
            "TokenFactory: Invalid sender for the request"
        );
        require(getStatus(id_) == RequestStatus.APPROVED, "TokenFactory: Invalid request status");

        deploymentParams.status = RequestStatus.EXECUTED;

        ERC20InitialParameters storage tokenParams = erc20Requests[id_].tokenParams;

        address token_ = address(
            new ERC20Initial(
                tokenParams.initHolder,
                tokenParams.initSupply,
                tokenParams.name,
                tokenParams.symbol
            )
        );

        emit ERC20Deployed(token_);
        return token_;
    }

    function requestERC20Deployment(ERC20InitialParameters calldata params_) external {
        currentId++;

        DeploymentRequestERC20 storage currentRequest = erc20Requests[currentId];

        currentRequest.deploymentParams.requester = msg.sender;
        currentRequest.tokenParams = params_;
    }

    function approveRequest(uint256 id_, uint64 deadline_) external onlyDeployer {
        BaseDeploymentParams storage currentRequestParams = erc20Requests[id_].deploymentParams;

        require(deadline_ > block.timestamp, "TokenFactoryRequestable: invalid deadline");
        require(
            currentRequestParams.requester != address(0),
            "TokenFactoryRequestable: request does not exist"
        );
        require(
            getStatus(id_) == RequestStatus.NONE,
            "TokenFactoryRequestable: invalid request status"
        );

        currentRequestParams.deadline = deadline_;
        currentRequestParams.status = RequestStatus.APPROVED;
    }

    function getStatus(uint256 id_) public view returns (RequestStatus) {
        BaseDeploymentParams storage deploymentParams_ = erc20Requests[id_].deploymentParams;

        RequestStatus status_ = deploymentParams_.status;

        if (status_ == RequestStatus.APPROVED && block.timestamp > deploymentParams_.deadline) {
            return RequestStatus.EXPIRED;
        }

        return status_;
    }
}
