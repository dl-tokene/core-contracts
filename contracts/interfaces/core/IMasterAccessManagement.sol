// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/interfaces/access-control/IRBAC.sol";

interface IMasterAccessManagement is IRBAC {
    function addPermissionsToRoleWithDescription(
        string memory role,
        string calldata description,
        ResourceWithPermissions[] memory allowedPermissions_,
        ResourceWithPermissions[] memory disallowedPermissions_
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
