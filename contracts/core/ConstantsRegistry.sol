// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";

import "../interfaces/core/IMasterAccessManagement.sol";
import "../interfaces/core/IMasterContractsRegistry.sol";
import "../interfaces/core/IConstantsRegistry.sol";

contract ConstantsRegistry is IConstantsRegistry, AbstractDependant {
    IMasterAccessManagement internal _masterAccess;

    mapping(string => bytes) public constants;

    event AddedConstant(string name, bytes value);
    event RemovedConstant(string name);

    modifier onlyCreatePermission() {
        require(
            _masterAccess.hasConstantsRegistryCreatePermission(msg.sender),
            "ConstantsRegistry: access denied"
        );
        _;
    }

    modifier onlyDeletePermission() {
        require(
            _masterAccess.hasConstantsRegistryDeletePermission(msg.sender),
            "ConstantsRegistry: access denied"
        );
        _;
    }

    function setDependencies(
        address registryAddress_,
        bytes calldata
    ) external override dependant {
        IMasterContractsRegistry registry_ = IMasterContractsRegistry(registryAddress_);
        _masterAccess = IMasterAccessManagement(registry_.getMasterAccessManagement());
    }

    function addConstant(
        string calldata key_,
        bytes calldata value_
    ) external override onlyCreatePermission {
        require(value_.length > 0, "ConstantsRegistry: empty value");

        constants[key_] = value_;

        emit AddedConstant(key_, value_);
    }

    function removeConstant(string calldata key_) external override onlyDeletePermission {
        require(constants[key_].length > 0, "ConstantsRegistry: constant does not exist");

        delete constants[key_];

        emit RemovedConstant(key_);
    }
}
