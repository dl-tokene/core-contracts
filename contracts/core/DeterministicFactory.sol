// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {AbstractDependant} from "@solarity/solidity-lib/contracts-registry/AbstractDependant.sol";

import {MasterContractsRegistry} from "./MasterContractsRegistry.sol";

import {IDeterministicFactory} from "../interfaces/core/IDeterministicFactory.sol";
import {IMasterAccessManagement} from "../interfaces/core/IMasterAccessManagement.sol";

contract DeterministicFactory is IDeterministicFactory, AbstractDependant, Initializable {
    IMasterAccessManagement internal _masterAccess;

    string public constant DETERMINISTIC_FACTORY_RESOURCE = "DETERMINISTIC_FACTORY_RESOURCE";
    string public constant DEPLOY_PERMISSION = "DEPLOY";

    function __DeterministicFactory_init() external initializer {}

    /**
     * @inheritdoc AbstractDependant
     */
    function setDependencies(address registryAddress_, bytes memory) public override dependant {
        MasterContractsRegistry registry_ = MasterContractsRegistry(registryAddress_);

        _masterAccess = IMasterAccessManagement(registry_.getMasterAccessManagement());
    }

    function deploy(
        bytes32 userSalt_,
        bytes calldata bytecode_
    ) external returns (address deployedAddress_) {
        require(
            _masterAccess.hasPermission(
                msg.sender,
                DETERMINISTIC_FACTORY_RESOURCE,
                DEPLOY_PERMISSION
            ),
            "DeterministicFactory: access denied"
        );

        bytes32 deploymentSalt_ = computeDeploymentSalt(msg.sender, userSalt_);

        deployedAddress_ = Create2.deploy(0, deploymentSalt_, bytecode_);

        emit Deployed(msg.sender, deployedAddress_);
    }

    function computeDeploymentSalt(
        address deployer_,
        bytes32 userSalt_
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(deployer_, userSalt_));
    }

    function computeAddress(
        address deployer_,
        bytes32 userSalt_,
        bytes32 bytecodeHash_
    ) public view returns (address) {
        bytes32 deploymentSalt_ = computeDeploymentSalt(deployer_, userSalt_);

        return Create2.computeAddress(deploymentSalt_, bytecodeHash_);
    }
}
