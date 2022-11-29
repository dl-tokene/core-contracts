// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/interfaces/access-control/IRBAC.sol";

interface IMasterAccessManagement is IRBAC {
    function addCombinedPermissionsToRole(
        string memory role_,
        string calldata description_,
        ResourceWithPermissions[] memory allowed_,
        ResourceWithPermissions[] memory disallowed_
    ) external;

    function removeCombinedPermissionsFromRole(
        string memory role_,
        ResourceWithPermissions[] memory allowed_,
        ResourceWithPermissions[] memory disallowed_
    ) external;

    function updateRolePermissions(
        string memory role_,
        string calldata description_,
        ResourceWithPermissions[] memory allowedToRemove_,
        ResourceWithPermissions[] memory disallowedToRemove_,
        ResourceWithPermissions[] memory allowedToAdd_,
        ResourceWithPermissions[] memory disallowedToAdd_
    ) external;

    function updateUserRoles(
        address user_,
        string[] memory rolesToRevoke_,
        string[] memory rolesToGrant_
    ) external;

    function hasMasterContractsRegistryCreatePermission(
        address account_
    ) external view returns (bool);

    function hasMasterContractsRegistryUpdatePermission(
        address account_
    ) external view returns (bool);

    function hasMasterContractsRegistryDeletePermission(
        address account_
    ) external view returns (bool);

    function hasConstantsRegistryCreatePermission(address account_) external view returns (bool);

    function hasConstantsRegistryDeletePermission(address account_) external view returns (bool);

    function hasReviewableRequestsCreatePermission(address account_) external view returns (bool);

    function hasReviewableRequestsExecutePermission(address account_) external view returns (bool);

    function hasReviewableRequestsDeletePermission(address account_) external view returns (bool);
}
