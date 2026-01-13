// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IRBAC} from "@solarity/solidity-lib/interfaces/access/IRBAC.sol";

interface IMasterAccessManagement is IRBAC {
    /**
     * @notice The event that gets emitted when the role with description is added
     * @param role the added role
     * @param description the specified description
     */
    event AddedRoleWithDescription(string role, string description);

    /**
     * @notice The function to add both allowed_ and disallowed_ permission to the role in a single call
     * @dev Access: CREATE permission
     * @param role_ the role to modify
     * @param description_ the new description of the role
     * @param allowed_ the list of allowed permissions to add
     * @param disallowed_ the list of disallowed permissions to add
     */
    function addCombinedPermissionsToRole(
        string memory role_,
        string calldata description_,
        ResourceWithPermissions[] memory allowed_,
        ResourceWithPermissions[] memory disallowed_
    ) external;

    /**
     * @notice The function to remove both allowed_ and disallowed_ permissions from the role in a single call
     * @dev Access: DELETE permission
     * @param role_ the role to modify
     * @param allowed_ the list of allowed permissions to remove
     * @param disallowed_ the list of disallowed permissions to remove
     */
    function removeCombinedPermissionsFromRole(
        string memory role_,
        ResourceWithPermissions[] memory allowed_,
        ResourceWithPermissions[] memory disallowed_
    ) external;

    /**
     * @notice The function to modify the role by removing and adding both allowed and disallowed permissions in a single call.
     * First removes then adds the new permission
     * @dev Access: DELETE and CREATE permissions
     * @param role_ the role to modify
     * @param description_ the new description of the role
     * @param allowedToRemove_ the list of allowed permissions to remove
     * @param disallowedToRemove_ the list of disallowed permissions to remove
     * @param allowedToAdd_ the list of allowed permissions to add
     * @param disallowedToAdd_ the list of disallowed permissions to add
     */
    function updateRolePermissions(
        string memory role_,
        string calldata description_,
        ResourceWithPermissions[] memory allowedToRemove_,
        ResourceWithPermissions[] memory disallowedToRemove_,
        ResourceWithPermissions[] memory allowedToAdd_,
        ResourceWithPermissions[] memory disallowedToAdd_
    ) external;

    /**
     * @notice The function to update the user roles in a single call. First revokes then adds the new roles
     * @dev Access: DELETE and CREATE permissions
     * @param user_ the user to modify
     * @param rolesToRevoke_ the roles to revoke from the user
     * @param rolesToGrant_ the roles to grant to the user
     */
    function updateUserRoles(
        address user_,
        string[] memory rolesToRevoke_,
        string[] memory rolesToGrant_
    ) external;

    /**
     * @notice The function to check if account_ has MasterContractsRegistry CREATE permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasMasterContractsRegistryCreatePermission(
        address account_
    ) external view returns (bool);

    /**
     * @notice The function to check if account_ has MasterContractsRegistry UPDATE permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasMasterContractsRegistryUpdatePermission(
        address account_
    ) external view returns (bool);

    /**
     * @notice The function to check if account_ has MasterContractsRegistry DELETE permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasMasterContractsRegistryDeletePermission(
        address account_
    ) external view returns (bool);

    /**
     * @notice The function to check if account_ has ConstantsRegistry CREATE permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasConstantsRegistryCreatePermission(address account_) external view returns (bool);

    /**
     * @notice The function to check if account_ has ConstantsRegistry DELETE permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasConstantsRegistryDeletePermission(address account_) external view returns (bool);

    /**
     * @notice The function to check if account_ has ReviewableRequests CREATE permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasReviewableRequestsCreatePermission(address account_) external view returns (bool);

    /**
     * @notice The function to check if account_ has ReviewableRequests EXECUTE permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasReviewableRequestsExecutePermission(address account_) external view returns (bool);

    /**
     * @notice The function to check if account_ has ReviewableRequests DELETE permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasReviewableRequestsDeletePermission(address account_) external view returns (bool);

    /**
     * @notice The function to check if account_ has NativeTokenRequestManager MINT permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasNativeTokenRequestManagerMintPermission(
        address account_
    ) external view returns (bool);

    /**
     * @notice The function to check if account_ has NativeTokenRequestManager BURN permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasNativeTokenRequestManagerBurnPermission(
        address account_
    ) external view returns (bool);

    /**
     * @notice The function to check if account_ has WhitelistedContractRegistry UPDATE permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasWhitelistedContractRegistryUpdatePermission(
        address account_
    ) external view returns (bool);

    /**
     * @notice The function to check if account_ has DeterministicFactory DEPLOY permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasDeterministicFactoryDeployPermission(
        address account_
    ) external view returns (bool);

    /**
     * @notice The function to check if account_ has ExternalProjectRegistry CREATE permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasExternalProjectRegistryCreatePermission(
        address account_
    ) external view returns (bool);

    /**
     * @notice The function to check if account_ has ExternalProjectRegistry UPDATE permission
     * @param account_ the account to check
     * @return true if the permission is present, false otherwise
     */
    function hasExternalProjectRegistryUpdatePermission(
        address account_
    ) external view returns (bool);
}
