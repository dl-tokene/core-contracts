// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IMasterContractsRegistry {
    function getMasterAccessManagement() external view returns (address);

    function getConstantsRegistry() external view returns (address);
}
