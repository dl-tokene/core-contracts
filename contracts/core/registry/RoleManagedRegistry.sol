// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "@dlsl/dev-modules/contracts-registry/AbstractContractsRegistry.sol";

import "../../interfaces/core/IMasterAccessManagement.sol";

abstract contract RoleManagedRegistry is AbstractContractsRegistry, UUPSUpgradeable {
    string public constant MASTER_ACCESS_MANAGEMENT_NAME = "MASTER_ACCESS_MANAGEMENT";

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

    function injectDependencies(string calldata name_) external onlyCreatePermission {
        _injectDependencies(name_);
    }

    function upgradeContract(
        string calldata name_,
        address newImplementation_
    ) external onlyUpdatePermission {
        _upgradeContract(name_, newImplementation_);
    }

    function upgradeContractAndCall(
        string calldata name_,
        address newImplementation_,
        bytes calldata data_
    ) external onlyUpdatePermission {
        _upgradeContractAndCall(name_, newImplementation_, data_);
    }

    function addContract(
        string calldata name_,
        address contractAddress_
    ) external onlyCreatePermission {
        _addContract(name_, contractAddress_);
    }

    function addProxyContract(
        string calldata name_,
        address contractAddress_
    ) external onlyCreatePermission {
        _addProxyContract(name_, contractAddress_);
    }

    function justAddProxyContract(
        string calldata name_,
        address contractAddress_
    ) external onlyCreatePermission {
        _justAddProxyContract(name_, contractAddress_);
    }

    function removeContract(string calldata name_) external onlyDeletePermission {
        _removeContract(name_);
    }

    function _authorizeUpgrade(
        address newImplementation_
    ) internal virtual override onlyCreatePermission {}
}
