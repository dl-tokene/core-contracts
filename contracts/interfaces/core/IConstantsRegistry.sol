// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IConstantsRegistry {
    /**
     * @notice The event that gets emitted when new constant is added
     * @param name the name of the constant
     * @param value the value of the constant
     */
    event AddedConstant(string name, bytes value);
    /**
     * @notice The event that gets emitted when a constant is deleted
     * @param name the name of the constant
     */
    event RemovedConstant(string name);

    /**
     * @notice The function to add a variable to the contract
     * @dev Access: CREATE permission
     * @param key_ the mapping key to store the value_
     * @param value_ the variable to store under the key_
     */
    function addConstant(string calldata key_, bytes calldata value_) external;

    /**
     * @notice The function to remove a variable from the contract
     * @dev Access: DELETE permission
     * @param key_ the key of the variable to delete
     */
    function removeConstant(string calldata key_) external;
}
