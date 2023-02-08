// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/access-control/RBAC.sol";

import "../interfaces/core/IMasterAccessManagement.sol";

/**
 * @notice The MasterAccessManagement contract, extends the RBAC contract. It adds several functions
 * to ease work for the FE and some function to quickly check the access for the core contracts.
 */
contract MasterAccessManagement is IMasterAccessManagement, RBAC {
    using ArrayHelper for string;

    string public constant EXECUTE_PERMISSION = "EXECUTE";

    string public constant MASTER_REGISTRY_RESOURCE = "MASTER_REGISTRY_RESOURCE";
    string public constant CONSTANTS_REGISTRY_RESOURCE = "CONSTANTS_REGISTRY_RESOURCE";
    string public constant REVIEWABLE_REQUESTS_RESOURCE = "REVIEWABLE_REQUESTS_RESOURCE";

    /**
     * @notice The initializer function
     * @param master_ the address that will receive a MASTER role
     */
    function __MasterAccessManagement_init(address master_) external initializer {
        __RBAC_init();
        _grantRoles(master_, MASTER_ROLE.asArray());
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function addCombinedPermissionsToRole(
        string calldata role_,
        string calldata description_,
        ResourceWithPermissions[] calldata allowed_,
        ResourceWithPermissions[] calldata disallowed_
    ) public override {
        addPermissionsToRole(role_, allowed_, true);
        addPermissionsToRole(role_, disallowed_, false);

        emit AddedRoleWithDescription(role_, description_);
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function removeCombinedPermissionsFromRole(
        string calldata role_,
        ResourceWithPermissions[] calldata allowed_,
        ResourceWithPermissions[] calldata disallowed_
    ) public override {
        removePermissionsFromRole(role_, allowed_, true);
        removePermissionsFromRole(role_, disallowed_, false);
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function updateRolePermissions(
        string calldata role_,
        string calldata description_,
        ResourceWithPermissions[] calldata allowedToRemove_,
        ResourceWithPermissions[] calldata disallowedToRemove_,
        ResourceWithPermissions[] calldata allowedToAdd_,
        ResourceWithPermissions[] calldata disallowedToAdd_
    ) external override {
        removeCombinedPermissionsFromRole(role_, allowedToRemove_, disallowedToRemove_);
        addCombinedPermissionsToRole(role_, description_, allowedToAdd_, disallowedToAdd_);
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function updateUserRoles(
        address user_,
        string[] calldata rolesToRevoke_,
        string[] calldata rolesToGrant_
    ) external override {
        revokeRoles(user_, rolesToRevoke_);
        grantRoles(user_, rolesToGrant_);
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function hasMasterContractsRegistryCreatePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, MASTER_REGISTRY_RESOURCE, CREATE_PERMISSION);
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function hasMasterContractsRegistryUpdatePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, MASTER_REGISTRY_RESOURCE, UPDATE_PERMISSION);
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function hasMasterContractsRegistryDeletePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, MASTER_REGISTRY_RESOURCE, DELETE_PERMISSION);
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function hasConstantsRegistryCreatePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, CONSTANTS_REGISTRY_RESOURCE, CREATE_PERMISSION);
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function hasConstantsRegistryDeletePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, CONSTANTS_REGISTRY_RESOURCE, DELETE_PERMISSION);
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function hasReviewableRequestsCreatePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, REVIEWABLE_REQUESTS_RESOURCE, CREATE_PERMISSION);
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function hasReviewableRequestsExecutePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, REVIEWABLE_REQUESTS_RESOURCE, EXECUTE_PERMISSION);
    }

    /**
     * @inheritdoc IMasterAccessManagement
     */
    function hasReviewableRequestsDeletePermission(
        address account_
    ) external view override returns (bool) {
        return hasPermission(account_, REVIEWABLE_REQUESTS_RESOURCE, DELETE_PERMISSION);
    }
}
