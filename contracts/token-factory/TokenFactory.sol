// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./ERC20Initial.sol";
import "../interfaces/IMasterRoleManagement.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";
import "../interfaces/IRegistry.sol";
import "./ITokenFactory.sol";

contract TokenFactoryRequestable is AbstractDependant, ITokenFactory {
    IMasterRoleManagement public masterRoles;

    uint256 public currentId;
    mapping(uint256 => DeploymentRequestERC20) public erc20Requests;
    // todo 2 more mappings for erc721 and erc115 but with same id

    event ERC20Deployed(address token_);

    function setDependencies(address contractsRegistry_) external virtual override dependant {
        IRegistry registry_ = IRegistry(contractsRegistry_);
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
        require(
            deploymentParams.status == RequestStatus.APPROVED,
            "TokenFactory: Invalid request status"
        );
        require(deploymentParams.deadline >= block.timestamp, "TokenFactory: Request has expired");

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
        require(deadline_ > block.timestamp, "TokenFactoryRequestable: invalid deadline");
        require(
            erc20Requests[id_].deploymentParams.requester != address(0),
            "TokenFactoryRequestable: request does not exist"
        );
        require(
            erc20Requests[id_].deploymentParams.status == RequestStatus.NONE,
            "TokenFactoryRequestable: invalid request status"
        );

        BaseDeploymentParams storage currentRequestParams = erc20Requests[id_].deploymentParams;

        currentRequestParams.deadline = deadline_;
        currentRequestParams.status = RequestStatus.APPROVED;
    }
}
