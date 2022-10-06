// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";
import "./interfaces/IMasterAccessManagement.sol";
import "./interfaces/IMasterContractsRegistry.sol";
import "./interfaces/IConstantsRegistry.sol";

contract ConstantsRegistry is IConstantsRegistry, AbstractDependant {
    IMasterAccessManagement masterAccess;

    mapping(string => bytes) public constants;

    function setDependencies(address registryAddress_) external override dependant {
        IMasterContractsRegistry registry_ = IMasterContractsRegistry(registryAddress_);
        masterAccess = IMasterAccessManagement(registry_.getMasterAccessManagement());
    }

    function addConstant(string calldata key_, bytes calldata value_) external {
        require(
            masterAccess.hasConstantsRegistryCreatePermission(msg.sender),
            "ConstantsRegistry: access denied"
        );

        constants[key_] = value_;
    }

    function removeConstant(string calldata key_) external {
        require(
            masterAccess.hasConstantsRegistryDeletePermission(msg.sender),
            "ConstantsRegistry: access denied"
        );
        delete constants[key_];
    }
}
