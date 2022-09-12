// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/access/IAccessControlEnumerableUpgradeable.sol";

interface IMasterRoleManagement is IAccessControlEnumerableUpgradeable {
    function hasMasterContractsRegistryAdminRole(address account_) external view returns (bool);

    function hasTokenFactoryAdminRole(address account_) external view returns (bool);

    function hasConstantsRegistryAdminRole(address account_) external view returns (bool);
}
