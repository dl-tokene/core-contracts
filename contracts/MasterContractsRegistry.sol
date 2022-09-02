// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./RoleManagedRegistry.sol";
import "./interfaces/IMasterContractsRegistry.sol";

contract MasterContractsRegistry is RoleManagedRegistry, IMasterContractsRegistry {
    string public constant TOKEN_FACTORY_NAME = "TOKEN_FACTORY";

    function __MasterContractsRegistry_init(address masterRoles_) external initializer {
        __RoleManagedRegistry_init(masterRoles_);
    }

    function getMasterRoleManagement() external view override returns (address) {
        return getContract(MASTER_ROLE_MANAGEMENT_NAME);
    }

    function getTokenFactory() external view override returns (address) {
        return getContract(TOKEN_FACTORY_NAME);
    }
}
