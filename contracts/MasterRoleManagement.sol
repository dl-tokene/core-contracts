// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";

contract MasterRoleManagement is AccessControlEnumerableUpgradeable, AbstractDependant {
    function __initMasterRoleManagement() external initializer {
        __AccessControlEnumerable_init();
    }

    function setDependencies(address contractsRegistry_) external virtual override dependant {}
}
