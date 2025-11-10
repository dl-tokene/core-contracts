// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {AbstractDependant} from "@solarity/solidity-lib/contracts-registry/AbstractDependant.sol";
import {SetHelper} from "@solarity/solidity-lib/libs/arrays/SetHelper.sol";

import {MasterContractsRegistry} from "./MasterContractsRegistry.sol";
import {MasterAccessManagement} from "./MasterAccessManagement.sol";

import {IWhitelistedContractRegistry} from "../interfaces/core/IWhitelistedContractRegistry.sol";

/**
 * @notice The WhitelistedContractRegistry contract. It is used to manage the whitelisted contracts.
 * It is used to add and remove contracts from the whitelist.
 */
contract WhitelistedContractRegistry is IWhitelistedContractRegistry, AbstractDependant {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SetHelper for EnumerableSet.AddressSet;

    MasterAccessManagement internal _masterAccess;

    EnumerableSet.AddressSet internal _whitelistedContracts;

    modifier onlyUpdatePermission() {
        require(
            _masterAccess.hasWhitelistedContractRegistryUpdatePermission(msg.sender),
            "WhitelistedContractRegistry: access denied"
        );
        _;
    }

    function setDependencies(address registryAddress_, bytes memory) public override dependant {
        MasterContractsRegistry registry_ = MasterContractsRegistry(registryAddress_);
        _masterAccess = MasterAccessManagement(registry_.getMasterAccessManagement());
    }

    function addWhitelistedContracts(
        address[] calldata contractAddresses_
    ) external onlyUpdatePermission {
        _whitelistedContracts.add(contractAddresses_);

        emit WhitelistedContractsAdded(contractAddresses_);
    }

    function removeWhitelistedContracts(
        address[] calldata contractAddresses_
    ) external onlyUpdatePermission {
        _whitelistedContracts.remove(contractAddresses_);

        emit WhitelistedContractsRemoved(contractAddresses_);
    }

    function isAllContractsWhitelisted(
        address[] calldata contractAddresses_
    ) external view returns (bool) {
        for (uint256 i = 0; i < contractAddresses_.length; ++i) {
            if (!_whitelistedContracts.contains(contractAddresses_[i])) {
                return false;
            }
        }
        return true;
    }
}
