// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IDeterministicFactory {
    event Deployed(address deployer, address indexed deployedAddress);

    /**
     * @notice The function to deploy a contract using the salt
     * @param userSalt_ the salt to use for the deterministic address
     * @param bytecode_ the bytecode of the contract to deploy
     * @return deployedAddress_ the address of the deployed contract
     */
    function deploy(
        bytes32 userSalt_,
        bytes calldata bytecode_
    ) external returns (address deployedAddress_);

    /**
     * @notice The function to compute the address of a contract using the salt
     * @param deployer_ the deployer of the contract
     * @param userSalt_ the salt to use for the deterministic address
     * @param bytecodeHash_ the hash of the bytecode of the contract
     * @return the address of the contract
     */
    function computeAddress(
        address deployer_,
        bytes32 userSalt_,
        bytes32 bytecodeHash_
    ) external view returns (address);

    /**
     * @notice The function to compute the deployment salt
     * @param deployer_ the deployer of the contract
     * @param userSalt_ the salt to use for the deterministic address
     * @return the deployment salt
     */
    function computeDeploymentSalt(
        address deployer_,
        bytes32 userSalt_
    ) external view returns (bytes32);
}
