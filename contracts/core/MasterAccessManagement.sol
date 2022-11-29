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

    function addCombinedPermissionsToRole(
        string memory role_,
        string calldata description_,
        ResourceWithPermissions[] memory allowed_,
        ResourceWithPermissions[] memory disallowed_
    ) public override {
        addPermissionsToRole(role_, allowed_, true);
        addPermissionsToRole(role_, disallowed_, false);

        emit AddedRoleWithDescription(role_, description_);
    }

    function removeCombinedPermissionsFromRole(
        string memory role_,
        ResourceWithPermissions[] memory allowed_,
        ResourceWithPermissions[] memory disallowed_
    ) public override {
        removePermissionsFromRole(role_, allowed_, true);
        removePermissionsFromRole(role_, disallowed_, false);
    }

    function updateRolePermissions(
        string memory role_,
        string calldata description_,
        ResourceWithPermissions[] memory allowedToRemove_,
        ResourceWithPermissions[] memory disallowedToRemove_,
        ResourceWithPermissions[] memory allowedToAdd_,
        ResourceWithPermissions[] memory disallowedToAdd_
    ) external override {
        removeCombinedPermissionsFromRole(role_, allowedToRemove_, disallowedToRemove_);
        addCombinedPermissionsToRole(role_, description_, allowedToAdd_, disallowedToAdd_);
    }

    function updateUserRoles(
        address user_,
        string[] memory rolesToRevoke_,
        string[] memory rolesToGrant_
    ) external override {
        revokeRoles(user_, rolesToRevoke_);
        grantRoles(user_, rolesToGrant_);
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
