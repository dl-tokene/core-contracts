// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";
import "./interfaces/IMasterRoleManagement.sol";
import "./interfaces/IMasterContractsRegistry.sol";
import "./interfaces/IConstantsRegistry.sol";

contract ConstantsRegistry is IConstantsRegistry, AbstractDependant {
    IMasterRoleManagement masterRoles;

    mapping(string => bytes) public constants;

    function setDependencies(address registryAddress_) external override dependant {
        IMasterContractsRegistry registry_ = IMasterContractsRegistry(registryAddress_);
        masterRoles = IMasterRoleManagement(registry_.getMasterRoleManagement());
    }

    modifier onlyAuthorizedRole() {
        require(
            masterRoles.hasConstantsRegistryAdminRole(msg.sender),
            "ConstantsRegistry: not a CONSTANTS_REGISTRY_ADMIN"
        );
        _;
    }

    function addConstant(string calldata key_, bytes calldata value_) external onlyAuthorizedRole {
        constants[key_] = value_;
    }

    function removeConstant(string calldata key_) external onlyAuthorizedRole {
        delete constants[key_];
    }
}
