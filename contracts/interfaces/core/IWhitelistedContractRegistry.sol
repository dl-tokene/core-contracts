// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IWhitelistedContractRegistry {
    /**
     * @notice The event that gets emitted when the contracts are added to the whitelist.
     * @param contractAddresses The contracts that were added.
     */
    event WhitelistedContractsAdded(address[] contractAddresses);
    /**
     * @notice The event that gets emitted when the contracts are removed from the whitelist.
     * @param contractAddresses The contracts that were removed.
     */
    event WhitelistedContractsRemoved(address[] contractAddresses);

    /**
     * @notice The function to add contracts to the whitelist.
     * @param contractAddresses_ The contracts to add.
     */
    function addWhitelistedContracts(address[] calldata contractAddresses_) external;

    /**
     * @notice The function to remove contracts from the whitelist.
     * @param contractAddresses_ The contracts to remove.
     */
    function removeWhitelistedContracts(address[] calldata contractAddresses_) external;

    /**
     * @notice The function to check if contracts are whitelisted.
     * @param contractAddresses_ The contracts to check.
     * @return true if the contracts are whitelisted, false otherwise.
     */
    function isAllContractsWhitelisted(
        address[] calldata contractAddresses_
    ) external view returns (bool);
}
