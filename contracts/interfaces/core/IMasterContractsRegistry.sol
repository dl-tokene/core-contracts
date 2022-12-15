// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IMasterContractsRegistry {
    event Initialized();

    function getMasterAccessManagement() external view returns (address);

    function getConstantsRegistry() external view returns (address);

    function getReviewableRequests() external view returns (address);
}
