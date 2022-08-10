// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./ERC20Initial.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract TokenFactoryRequestable is Initializable {
    struct DeploymentRequest {
        address requester;
        uint64 deadline;
        bool status;
    }

    IAccessControlUpgradeable masterRoles;
    address registry;
    bytes32 constant TOKEN_DEPLOYER_ROLE =
        0xcea374d80206351afc882fb26f681b164f73bc498895c514e00ad07da11f8d89;

    uint256 currentId;
    mapping(uint256 => DeploymentRequest) requests;

    function __initTokenFactoryRequestable(address registry_, address masterRoles_)
        external
        initializer
    {
        registry = registry_;
        masterRoles = IAccessControlUpgradeable(masterRoles_);
    }

    modifier onlyDeployer() {
        require(
            masterRoles.hasRole(TOKEN_DEPLOYER_ROLE, msg.sender),
            "TokenFactoryRequestable: not a deployer"
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
                masterRoles.hasRole(TOKEN_DEPLOYER_ROLE, msg.sender),
                "TokenFactoryRequestable: not a deployer"
            );
        } else {
            require(requests[id_].status, "TokenFactoryRequestable: not approved");
            require(
                requests[id_].deadline > block.timestamp,
                "TokenFactoryRequestable: dedline has passed"
            );
            require(
                requests[id_].requester == msg.sender,
                "TokenFactoryRequestable: invalid approve requester"
            );
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
        requests[id_].status = true;
    }
}
