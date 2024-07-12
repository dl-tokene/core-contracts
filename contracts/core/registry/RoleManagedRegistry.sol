// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import {AbstractContractsRegistry} from "@solarity/solidity-lib/contracts-registry/AbstractContractsRegistry.sol";

import {IMasterAccessManagement} from "../../interfaces/core/IMasterAccessManagement.sol";

/**
 * @notice The RBAC realization of the AbstractContractsRegistry contract. It uses
 * special roles to allow users to modify its state.
 *
 * The user with CREATE permission will be able to upgrade this contract.
 */
abstract contract RoleManagedRegistry is AbstractContractsRegistry, UUPSUpgradeable {
    string public constant MASTER_ACCESS_MANAGEMENT_NAME = "MASTER_ACCESS_MANAGEMENT";

    /**
     * @notice The internal initializer function
     * @param masterAccess_ the MasterAccessManagement contract
     */
    function __RoleManagedRegistry_init(address masterAccess_) internal onlyInitializing {
        __ContractsRegistry_init();
        _addProxyContract(MASTER_ACCESS_MANAGEMENT_NAME, masterAccess_);
    }

    modifier onlyCreatePermission() virtual {
        _;
    }

    modifier onlyUpdatePermission() virtual {
        _;
    }

    modifier onlyDeletePermission() virtual {
        _;
    }

    /**
     * @notice The function to inject dependencies to the registered contract
     * @dev Access: CREATE permission
     * @param name_ the associated contract name
     */
    function injectDependencies(string calldata name_) external onlyCreatePermission {
        _injectDependencies(name_);
    }

    /**
     * @notice The function to inject dependencies to the registered contract with additional data
     * @dev Access: CREATE permission
     * @param name_ the associated contract name
     * @param data_ the additional data
     */
    function injectDependenciesWithData(
        string calldata name_,
        bytes calldata data_
    ) external onlyCreatePermission {
        _injectDependenciesWithData(name_, data_);
    }

    /**
     * @notice The function to upgrade the registered proxy contract
     * @dev Access: UPDATE permission
     * @param name_ the associated proxy contract name
     * @param newImplementation_ the implementation the proxy will be upgraded with
     */
    function upgradeContract(
        string calldata name_,
        address newImplementation_
    ) external onlyUpdatePermission {
        _upgradeContract(name_, newImplementation_);
    }

    /**
     * @notice The function to upgrade and call the registered proxy contract
     * @dev Access: UPDATE permission
     * @param name_ the associated proxy contract name
     * @param newImplementation_ the implementation the proxy will be upgraded with
     * @param data_ the data the proxy will be called with
     */
    function upgradeContractAndCall(
        string calldata name_,
        address newImplementation_,
        bytes calldata data_
    ) external onlyUpdatePermission {
        _upgradeContractAndCall(name_, newImplementation_, data_);
    }

    /**
     * @notice The function to add the contract to the registry
     * @dev Access: CREATE permission
     * @param name_ the name to associate the contract with
     * @param contractAddress_ the address of the contract to add
     */
    function addContract(
        string calldata name_,
        address contractAddress_
    ) external onlyCreatePermission {
        _addContract(name_, contractAddress_);
    }

    /**
     * @notice The function to add the given contract as a proxy. Deploys a TUP on top of the provided contract
     * @dev Access: CREATE permission
     * @param name_ the name to associate the contract with
     * @param contractAddress_ the contract to be set as an implementation of the TUP
     */
    function addProxyContract(
        string calldata name_,
        address contractAddress_
    ) external onlyCreatePermission {
        _addProxyContract(name_, contractAddress_);
    }

    /**
     * @notice The function to add the proxy contract to the registry. The registry upgrader should
     * be given the rights to upgrade this contract
     * @dev Access: CREATE permission
     * @param name_ the name to associate the contract with
     * @param contractAddress_ the proxy contract to add
     */
    function justAddProxyContract(
        string calldata name_,
        address contractAddress_
    ) external onlyCreatePermission {
        _justAddProxyContract(name_, contractAddress_);
    }

    /**
     * @notice The function to remove the contract from the registry
     * @dev Access: DELETE permission
     * @param name_ the name of the contract to delete
     */
    function removeContract(string calldata name_) external onlyDeletePermission {
        _removeContract(name_);
    }

    /**
     * @notice The internal UUPS access control function
     * @dev Access: CREATE permission
     */
    function _authorizeUpgrade(
        address newImplementation_
    ) internal virtual override onlyCreatePermission {}
}
