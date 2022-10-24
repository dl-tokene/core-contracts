// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./interfaces/IMasterContractsRegistry.sol";

import "./registry/RoleManagedRegistry.sol";

contract MasterContractsRegistry is IMasterContractsRegistry, RoleManagedRegistry {
    string public constant CONSTANTS_REGISTRY_NAME = "CONSTANTS_REGISTRY";
    string public constant REVIEWABLE_REQUESTS_NAME = "REVIEWABLE_REQUESTS";

    function __MasterContractsRegistry_init(address masterAccess_) external initializer {
        __RoleManagedRegistry_init(masterAccess_);
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

    function getMasterAccessManagement() public view override returns (address) {
        return getContract(MASTER_ACCESS_MANAGEMENT_NAME);
    }

    function getConstantsRegistry() external view override returns (address) {
        return getContract(CONSTANTS_REGISTRY_NAME);
    }

    function getReviewableRequests() external view override returns (address) {
        return getContract(REVIEWABLE_REQUESTS_NAME);
    }
}
