// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IMasterContractsRegistry} from "../interfaces/core/IMasterContractsRegistry.sol";

import {RoleManagedRegistry, IMasterAccessManagement} from "./registry/RoleManagedRegistry.sol";

/**
 * @notice The MasterContractsRegistry contract, extends RoleManagedRegistry.
 * Realizes EIP-6224 Contracts Dependencies Registry
 */
contract MasterContractsRegistry is IMasterContractsRegistry, RoleManagedRegistry {
    string public constant CONSTANTS_REGISTRY_NAME = "CONSTANTS_REGISTRY";
    string public constant REVIEWABLE_REQUESTS_NAME = "REVIEWABLE_REQUESTS";
    string public constant MULTICALL_NAME = "MULTICALL";

    /**
     * @notice The initializer function
     * @param masterAccess_ the MasterAccessManagement contract
     */
    function __MasterContractsRegistry_init(address masterAccess_) external initializer {
        __RoleManagedRegistry_init(masterAccess_);

        emit Initialized();
    }

    modifier onlyCreatePermission() override {
        require(
            IMasterAccessManagement(getMasterAccessManagement())
                .hasMasterContractsRegistryCreatePermission(msg.sender),
            "MasterContractsRegistry: access denied"
        );
        _;
    }

    modifier onlyUpdatePermission() override {
        require(
            IMasterAccessManagement(getMasterAccessManagement())
                .hasMasterContractsRegistryUpdatePermission(msg.sender),
            "MasterContractsRegistry: access denied"
        );
        _;
    }

    modifier onlyDeletePermission() override {
        require(
            IMasterAccessManagement(getMasterAccessManagement())
                .hasMasterContractsRegistryDeletePermission(msg.sender),
            "MasterContractsRegistry: access denied"
        );
        _;
    }

    /**
     * @inheritdoc IMasterContractsRegistry
     */
    function getMasterAccessManagement() public view override returns (address) {
        return getContract(MASTER_ACCESS_MANAGEMENT_NAME);
    }

    /**
     * @inheritdoc IMasterContractsRegistry
     */
    function getConstantsRegistry() external view override returns (address) {
        return getContract(CONSTANTS_REGISTRY_NAME);
    }

    /**
     * @inheritdoc IMasterContractsRegistry
     */
    function getReviewableRequests() external view override returns (address) {
        return getContract(REVIEWABLE_REQUESTS_NAME);
    }

    /**
     * @inheritdoc IMasterContractsRegistry
     */
    function getMulticall() external view override returns (address) {
        return getContract(MULTICALL_NAME);
    }
}
