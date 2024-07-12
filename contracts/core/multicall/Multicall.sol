// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {AbstractDependant} from "@solarity/solidity-lib/contracts-registry/AbstractDependant.sol";

import {IMasterAccessManagement} from "../../interfaces/core/IMasterAccessManagement.sol";
import {IMasterContractsRegistry} from "../../interfaces/core/IMasterContractsRegistry.sol";

import {MulticallExecutor, IMulticall} from "./MulticallExecutor.sol";

/**
 * @notice The Multicall contract. It grants `msg.sender` roles to the internal MulticallExecutor
 * contract and delegates it the execution of a batch of functions. When the executor contract completes,
 * the facade multicall contract revokes the given roles.
 *
 * This contract must be able to manage `RBAC_RESOURCE` in order to grant/revoke roles to/from the
 * executor contract.
 */
contract Multicall is IMulticall, Initializable, AbstractDependant, ReentrancyGuard {
    IMasterAccessManagement internal _masterAccess;
    IMulticall internal _multicallExecutor;

    /**
     * @notice The initializer function
     */
    function __Multicall_init() external initializer {
        _multicallExecutor = new MulticallExecutor();
    }

    /**
     * @notice The function to set the required dependencies
     * @dev Access: the injector address
     * @param registryAddress_ the address of the ContractsRegistry
     */
    function setDependencies(address registryAddress_, bytes memory) public override dependant {
        IMasterContractsRegistry registry_ = IMasterContractsRegistry(registryAddress_);
        _masterAccess = IMasterAccessManagement(registry_.getMasterAccessManagement());
    }

    /**
     * @inheritdoc IMulticall
     */
    function multicall(
        address[] calldata targets_,
        bytes[] calldata data_
    ) external override nonReentrant returns (bytes[] memory outputs_) {
        require(targets_.length == data_.length, "Multicall: lengths mismatch");

        string[] memory userRoles_ = _masterAccess.getUserRoles(msg.sender);

        if (userRoles_.length > 0) {
            _masterAccess.grantRoles(address(_multicallExecutor), userRoles_);
        }

        outputs_ = _multicallExecutor.multicall(targets_, data_);

        if (userRoles_.length > 0) {
            _masterAccess.revokeRoles(address(_multicallExecutor), userRoles_);
        }
    }

    /**
     * @inheritdoc IMulticall
     */
    function multicallWithValues(
        address[] calldata targets_,
        bytes[] calldata data_,
        uint256[] calldata values_
    ) external payable override nonReentrant returns (bytes[] memory outputs_) {
        require(
            targets_.length == data_.length && data_.length == values_.length,
            "Multicall: lengths mismatch"
        );

        string[] memory userRoles_ = _masterAccess.getUserRoles(msg.sender);

        if (userRoles_.length > 0) {
            _masterAccess.grantRoles(address(_multicallExecutor), userRoles_);
        }

        outputs_ = _multicallExecutor.multicallWithValues{value: msg.value}(
            targets_,
            data_,
            values_
        );

        if (userRoles_.length > 0) {
            _masterAccess.revokeRoles(address(_multicallExecutor), userRoles_);
        }
    }
}
