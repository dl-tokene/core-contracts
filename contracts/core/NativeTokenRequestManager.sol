// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {AbstractDependant} from "@solarity/solidity-lib/contracts-registry/AbstractDependant.sol";

import {IMasterAccessManagement} from "../interfaces/core/IMasterAccessManagement.sol";
import {IMasterContractsRegistry} from "../interfaces/core/IMasterContractsRegistry.sol";
import {INativeTokenRequestManager} from "../interfaces/core/INativeTokenRequestManager.sol";

contract NativeTokenRequestManager is
    INativeTokenRequestManager,
    AbstractDependant,
    Initializable
{
    IMasterAccessManagement internal _masterAccess;

    function __NativeTokenRequestManager_init() external initializer {}

    /**
     * @notice The function to set the required dependencies
     * @dev Access: the injector address
     * @param registryAddress_ the address of the ContractsRegistry
     */
    function setDependencies(address registryAddress_, bytes memory) public override dependant {
        IMasterContractsRegistry registry_ = IMasterContractsRegistry(registryAddress_);
        _masterAccess = IMasterAccessManagement(registry_.getMasterAccessManagement());
    }

    function mint(address recipient_, uint256 amount_) external {
        require(
            _masterAccess.hasNativeTokenRequestManagerMintPermission(msg.sender),
            "NativeTokenRequestManager: access denied"
        );

        emit MintRequested(recipient_, amount_);
    }

    function burn() external payable {
        require(
            _masterAccess.hasNativeTokenRequestManagerBurnPermission(msg.sender),
            "NativeTokenRequestManager: access denied"
        );

        emit BurnRequested();
    }
}
