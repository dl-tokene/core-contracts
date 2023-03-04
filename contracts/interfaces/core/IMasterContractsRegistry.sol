// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IMasterContractsRegistry {
    /**
     * @notice The event that gets emitted when the contract initializes
     */
    event Initialized();

    /**
     * @notice The function to get the MasterAccessManagement contract
     * @return MasterAccessManagement contract address
     */
    function getMasterAccessManagement() external view returns (address);

    /**
     * @notice The function to get the ConstantsRegistry contract
     * @return ConstantsRegistry contract address
     */
    function getConstantsRegistry() external view returns (address);

    /**
     * @notice The function to get the ReviewableRequests contract
     * @return ReviewableRequests contract address
     */
    function getReviewableRequests() external view returns (address);

    /**
     * @notice The function to get the Multicall contract
     * @return Multicall contract address
     */
    function getMulticall() external view returns (address);
}
