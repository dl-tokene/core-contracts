// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";

contract MasterRoleManagement is AccessControlEnumerableUpgradeable {
    bytes32 public constant MASTER_REGISTRY_ADMIN_ROLE = keccak256("MASTER_REGISTRY_ADMIN");
    bytes32 public constant TOKEN_FACTORY_ADMIN_ROLE = keccak256("TOKEN_FACTORY_ADMIN");
    bytes32 public constant CONSTANTS_REGISTRY_ADMIN_ROLE = keccak256("CONSTANTS_REGISTRY_ADMIN");

    function __MasterRoleManagement_init() external initializer {
        __AccessControlEnumerable_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function hasMasterContractsRegistryAdminRole(address account_) external view returns (bool) {
        return hasRole(MASTER_REGISTRY_ADMIN_ROLE, account_);
    }

    function hasTokenFactoryAdminRole(address account_) external view returns (bool) {
        return hasRole(TOKEN_FACTORY_ADMIN_ROLE, account_);
    }

    function hasConstantsRegistryAdminRole(address account_) external view returns (bool) {
        return hasRole(CONSTANTS_REGISTRY_ADMIN_ROLE, account_);
    }
}
