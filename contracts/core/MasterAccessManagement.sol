// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/access-control/RBAC.sol";

import "../interfaces/core/IMasterAccessManagement.sol";

contract MasterAccessManagement is IMasterAccessManagement, RBAC {
    using ArrayHelper for string;

    string public constant EXECUTE_PERMISSION = "EXECUTE";

    string public constant MASTER_REGISTRY_RESOURCE = "MASTER_REGISTRY_RESOURCE";
    string public constant CONSTANTS_REGISTRY_RESOURCE = "CONSTANTS_REGISTRY_RESOURCE";
    string public constant REVIEWABLE_REQUESTS_RESOURCE = "REVIEWABLE_REQUESTS_RESOURCE";

    event AddedRoleWithDescription(string role, string description);

    function __MasterAccessManagement_init(address master_) external initializer {
        __RBAC_init();
        _grantRoles(master_, MASTER_ROLE.asArray());
    }

    function addPermissionsToRoleWithDescription(
        string memory role_,
        string calldata description_,
        ResourceWithPermissions[] memory allowedPermissions_,
        ResourceWithPermissions[] memory disallowedPermissions_
    ) external override {
        addPermissionsToRole(role_, allowedPermissions_, true);
        addPermissionsToRole(role_, disallowedPermissions_, false);

        emit AddedRoleWithDescription(role_, description_);
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
