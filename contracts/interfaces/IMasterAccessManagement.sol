// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IMasterAccessManagement {
    function hasMasterContractsRegistryCreatePermission(address account_)
        external
        view
        returns (bool);

    function hasMasterContractsRegistryUpdatePermission(address account_)
        external
        view
        returns (bool);

    function hasMasterContractsRegistryDeletePermission(address account_)
        external
        view
        returns (bool);

    function hasConstantsRegistryCreatePermission(address account_) external view returns (bool);

    function hasConstantsRegistryDeletePermission(address account_) external view returns (bool);
}
