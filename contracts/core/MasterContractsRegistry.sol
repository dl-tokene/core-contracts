// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./interfaces/IMasterContractsRegistry.sol";
import "./RoleManagedRegistry.sol";

contract MasterContractsRegistry is IMasterContractsRegistry, RoleManagedRegistry {
    string public constant CONSTANTS_REGISTRY_NAME = "CONSTANTS_REGISTRY";

    function __MasterContractsRegistry_init(address masterRoles_) external initializer {
        __RoleManagedRegistry_init(masterRoles_);
    }

    function getMasterAccessManagement() external view override returns (address) {
        return getContract(MASTER_ACCESS_MANAGEMENT_NAME);
    }

    function getConstantsRegistry() external view override returns (address) {
        return getContract(CONSTANTS_REGISTRY_NAME);
    }
}
