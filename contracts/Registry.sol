pragma solidity 0.8.16;

import "./RoleManagedRegistry.sol";
import "./interfaces/IRegistry.sol";

contract Registry is RoleManagedRegistry, IRegistry {
    string public constant TOKEN_FACTORY_NAME = "TOKEN_FACTORY";

    function __Registry_init() external initializer {
        __RoleManagedRegistry_init();
    }

    function getMasterRoleManagement() external view override returns (address) {
        return getContract(MASTER_ROLE_MANAGEMENT_NAME);
    }

    function getTokenFactory() external view override returns (address) {
        return getContract(TOKEN_FACTORY_NAME);
    }
}
