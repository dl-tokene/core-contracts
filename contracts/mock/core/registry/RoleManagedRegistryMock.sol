// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {RoleManagedRegistry} from "../../../core/registry/RoleManagedRegistry.sol";

contract RoleManagedRegistryMock is RoleManagedRegistry {
    function init(
        address masterAccess_
    ) external onlyCreatePermission onlyUpdatePermission onlyDeletePermission {
        __RoleManagedRegistry_init(masterAccess_);
    }
}
