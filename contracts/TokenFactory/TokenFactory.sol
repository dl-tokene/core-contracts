// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./ERC20Initial.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";
import "../interfaces/IRegistry.sol";
import "./ITokenFactory.sol";

contract TokenFactoryRequestable is Initializable, AbstractDependant, ITokenFactory {
    IAccessControlEnumerableUpgradeable masterRoles;

    uint256 currentId;
    mapping(uint256 => DeploymentRequest) requests;

    function __initTokenFactoryRequestable() external initializer {}

    function setDependencies(address contractsRegistry_) external virtual override dependant {
        IRegistry registry_ = IRegistry(contractsRegistry_);
        masterRoles = IAccessControlEnumerableUpgradeable(registry_.getMasterRoleManagement());
    }

    modifier onlyDeployer() {
        require(
            masterRoles.hasRole(keccak256("TOKEN_FACTORY_ADMIN"), msg.sender),
            "TokenFactoryRequestable: not a TOKEN_FACTORY_ADMIN"
        );
        _;
    }

    function deployERC20(
        uint256 id_,
        address initHolder_,
        uint256 initSupply_,
        string memory name_,
        string memory symbol_
    ) external returns (address) {
        if (id_ == 0) {
            require(
                masterRoles.hasRole(keccak256("TOKEN_FACTORY_ADMIN"), msg.sender),
                "TokenFactoryRequestable: not a TOKEN_FACTORY_ADMIN"
            );
        } else {
            require(
                requests[id_].status == RequestStatus.APPROVED,
                "TokenFactoryRequestable: not approved"
            );
            require(
                requests[id_].deadline > block.timestamp,
                "TokenFactoryRequestable: dedline has passed"
            );
            require(
                requests[id_].requester == msg.sender,
                "TokenFactoryRequestable: invalid approve requester"
            );

            requests[id_].status = RequestStatus.EXECUTED;
        }

        address erc20_ = address(new ERC20Initial(initHolder_, initSupply_, name_, symbol_));

        return erc20_;
    }

    function requestDeployment() external {
        currentId++;
        requests[currentId].requester = msg.sender;
    }

    function approveRequest(uint256 id_, uint64 deadline_) external onlyDeployer {
        require(deadline_ > block.timestamp, "TokenFactoryRequestable: invalid deadline");
        requests[id_].deadline = deadline_;
        requests[id_].status = RequestStatus.APPROVED;
    }
}
