// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/access-control/RBAC.sol";

import "../interfaces/IMasterAccessManagement.sol";

contract MasterAccessManagement is IMasterAccessManagement, RBAC {
    using ArrayHelper for string;

    string public constant EXECUTE_PERMISSION = "EXECUTE";

    string public constant MASTER_REGISTRY_RESOURCE = "MASTER_REGISTRY_RESOURCE";
    string public constant CONSTANTS_REGISTRY_RESOURCE = "CONSTANTS_REGISTRY_RESOURCE";
    string public constant REVIEWABLE_REQUESTS_RESOURCE = "REVIEWABLE_REQUESTS_RESOURCE";

    function __MasterAccessManagement_init(address master_) external initializer {
        __RBAC_init();
        _grantRoles(master_, MASTER_ROLE.asArray());
    }

    function hasMasterContractsRegistryCreatePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, MASTER_REGISTRY_RESOURCE, CREATE_PERMISSION);
    }

    function hasMasterContractsRegistryUpdatePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, MASTER_REGISTRY_RESOURCE, UPDATE_PERMISSION);
    }

    function hasMasterContractsRegistryDeletePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, MASTER_REGISTRY_RESOURCE, DELETE_PERMISSION);
    }

    function hasConstantsRegistryCreatePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, CONSTANTS_REGISTRY_RESOURCE, CREATE_PERMISSION);
    }

    function hasConstantsRegistryDeletePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, CONSTANTS_REGISTRY_RESOURCE, DELETE_PERMISSION);
    }

    function hasReviewableRequestsCreatePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, REVIEWABLE_REQUESTS_RESOURCE, CREATE_PERMISSION);
    }

    function hasReviewableRequestsExecutePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, REVIEWABLE_REQUESTS_RESOURCE, EXECUTE_PERMISSION);
    }

    function hasReviewableRequestsDeletePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, REVIEWABLE_REQUESTS_RESOURCE, DELETE_PERMISSION);
    }
}
