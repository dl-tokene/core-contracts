// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface IMasterContractsRegistry {
    function getMasterRoleManagement() external view returns (address);

    function getTokenFactory() external view returns (address);

    function getConstantsRegistry() external view returns (address);
}
