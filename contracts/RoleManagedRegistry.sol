pragma solidity 0.8.16;

import "@dlsl/dev-modules/contracts-registry/AbstractContractsRegistry.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlEnumerableUpgradeable.sol";

abstract contract RoleManagedRegistry is AbstractContractsRegistry {
    string public constant MASTER_ROLE_MANAGEMENT_NAME = "MASTER_ROLE_MANAGEMENT";

    function __RoleManagedRegistry_init() public onlyInitializing {
        __ContractsRegistry_init();
    }

    modifier onlyMasterRole() {
        require(
            IAccessControlEnumerableUpgradeable(getContract("MASTER_ROLE_MANAGEMENT_NAME"))
                .hasRole(keccak256("MASTER_REGISTRY_ADMIN"), msg.sender),
            "RoleManagedRegistry: Not a MASTER_REGISTRY_ADMIN"
        );
        _;
    }

    function injectDependencies(string calldata name_) external onlyMasterRole {
        _injectDependencies(name_);
    }

    function upgradeContract(string calldata name_, address newImplementation_)
        external
        onlyMasterRole
    {
        _upgradeContract(name_, newImplementation_);
    }

    function upgradeContractAndCall(
        string calldata name_,
        address newImplementation_,
        bytes calldata data_
    ) external onlyMasterRole {
        _upgradeContractAndCall(name_, newImplementation_, data_);
    }

    function addContract(string calldata name_, address contractAddress_) external onlyMasterRole {
        _addContract(name_, contractAddress_);
    }

    function addProxyContract(string calldata name_, address contractAddress_)
        external
        onlyMasterRole
    {
        _addProxyContract(name_, contractAddress_);
    }

    function justAddProxyContract(string calldata name_, address contractAddress_)
        external
        onlyMasterRole
    {
        _justAddProxyContract(name_, contractAddress_);
    }

    function removeContract(string calldata name_) external onlyMasterRole {
        _removeContract(name_);
    }
}
