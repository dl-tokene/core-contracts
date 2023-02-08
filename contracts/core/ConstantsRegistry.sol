// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";

import "../interfaces/core/IMasterAccessManagement.sol";
import "../interfaces/core/IMasterContractsRegistry.sol";
import "../interfaces/core/IConstantsRegistry.sol";

/**
 * @notice The ConstantsRegistry contract. It stores system-wide variables that
 * smart contracts and offchain services may use.
 *
 * Right now the contract is built around a single bytes mapping. The future realizations will extend
 * its ability to store more types and aggregate them into groups.
 */
contract ConstantsRegistry is IConstantsRegistry, AbstractDependant {
    IMasterAccessManagement internal _masterAccess;

    mapping(string => bytes) public constants;

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

    /**
     * @notice The function to set required dependencies
     * @dev Access: the injector address
     * @param registryAddress_ the address of the ContractsRegistry
     */
    function setDependencies(
        address registryAddress_,
        bytes calldata
    ) external override dependant {
        IMasterContractsRegistry registry_ = IMasterContractsRegistry(registryAddress_);
        _masterAccess = IMasterAccessManagement(registry_.getMasterAccessManagement());
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function addConstant(
        string calldata key_,
        bytes calldata value_
    ) external override onlyCreatePermission {
        require(value_.length > 0, "ConstantsRegistry: empty value");

        constants[key_] = value_;

        emit AddedConstant(key_, value_);
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function removeConstant(string calldata key_) external override onlyDeletePermission {
        require(constants[key_].length > 0, "ConstantsRegistry: constant does not exist");

        delete constants[key_];

        emit RemovedConstant(key_);
    }
}
