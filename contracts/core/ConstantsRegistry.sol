// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";

import "../interfaces/core/IMasterAccessManagement.sol";
import "../interfaces/core/IMasterContractsRegistry.sol";
import "../interfaces/core/IConstantsRegistry.sol";

/**
 * @notice The ConstantsRegistry contract. It stores system-wide variables that
 * smart contracts and off-chain services may use.
 *
 * Currently, the ConstantsRegistry supports `bytes`, `string`, `uint256`, `address`, `bytes32`
 * types for constant values. This implementation assumes the use of string keys with off-chain
 * accepted delimiters in order to achieve the compound keys behaviour.
 */
contract ConstantsRegistry is IConstantsRegistry, AbstractDependant {
    IMasterAccessManagement internal _masterAccess;

    mapping(string => bytes) private _constants;

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
    function addBytes(
        string calldata key_,
        bytes calldata value_
    ) external override onlyCreatePermission {
        require(value_.length > 0, "ConstantsRegistry: empty value");

        _constants[key_] = value_;

        emit AddedBytes(key_, value_);
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function addString(
        string calldata key_,
        string calldata value_
    ) external override onlyCreatePermission {
        bytes memory valueBytes_ = abi.encode(value_);

        _constants[key_] = valueBytes_;

        emit AddedString(key_, valueBytes_);
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function addUint256(
        string calldata key_,
        uint256 value_
    ) external override onlyCreatePermission {
        bytes memory valueBytes_ = abi.encode(value_);

        _constants[key_] = valueBytes_;

        emit AddedUint256(key_, valueBytes_);
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function addAddress(
        string calldata key_,
        address value_
    ) external override onlyCreatePermission {
        bytes memory valueBytes_ = abi.encode(value_);

        _constants[key_] = valueBytes_;

        emit AddedAddress(key_, valueBytes_);
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function addBytes32(
        string calldata key_,
        bytes32 value_
    ) external override onlyCreatePermission {
        bytes memory valueBytes_ = abi.encode(value_);

        _constants[key_] = valueBytes_;

        emit AddedBytes32(key_, valueBytes_);
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function remove(string calldata key_) external override onlyDeletePermission {
        require(_constants[key_].length > 0, "ConstantsRegistry: constant does not exist");

        delete _constants[key_];

        emit Removed(key_);
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function getBytes(string calldata key_) external view override returns (bytes memory) {
        return _constants[key_];
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function getString(string calldata key_) external view override returns (string memory) {
        return abi.decode(_constants[key_], (string));
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function getUint256(string calldata key_) external view override returns (uint256) {
        return abi.decode(_constants[key_], (uint256));
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function getAddress(string calldata key_) external view override returns (address) {
        return abi.decode(_constants[key_], (address));
    }

    /**
     * @inheritdoc IConstantsRegistry
     */
    function getBytes32(string calldata key_) external view override returns (bytes32) {
        return abi.decode(_constants[key_], (bytes32));
    }
}
