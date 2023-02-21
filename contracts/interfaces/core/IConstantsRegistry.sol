// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IConstantsRegistry {
    /**
     * @notice The event that gets emitted when the new `bytes` constant is added
     * @param name the name of the `bytes` constant
     * @param value the value of the `bytes` constant
     */
    event AddedBytes(string name, bytes value);
    /**
     * @notice The event that gets emitted when the new `string` constant is added
     * @param name the name of the `string` constant
     * @param value the `bytes` representation of the `string` constant
     */
    event AddedString(string name, bytes value);
    /**
     * @notice The event that gets emitted when the new `uint256` constant is added
     * @param name the name of the `uint256` constant
     * @param value the `bytes` representation of the `uint256` constant
     */
    event AddedUint256(string name, bytes value);
    /**
     * @notice The event that gets emitted when the new `address` constant is added
     * @param name the name of the `address` constant
     * @param value the `bytes` representation of the `address` constant
     */
    event AddedAddress(string name, bytes value);
    /**
     * @notice The event that gets emitted when the new `bytes32` constant is added
     * @param name the name of the `bytes32` constant
     * @param value the `bytes` representation of the `bytes32` constant
     */
    event AddedBytes32(string name, bytes value);
    /**
     * @notice The event that gets emitted when the constant is deleted
     * @param name the name of the constant
     */
    event Removed(string name);

    /**
     * @notice The function to add the `bytes` constant to the contract
     * @dev Access: CREATE permission
     * @param key_ the mapping key to store the value_
     * @param value_ the `bytes` constant value to store under the key_
     */
    function addBytes(string calldata key_, bytes calldata value_) external;

    /**
     * @notice The function to add the `string` constant to the contract
     * @dev Access: CREATE permission
     * @param key_ the mapping key to store the value_
     * @param value_ the `string` constant value to store under the key_
     */
    function addString(string calldata key_, string calldata value_) external;

    /**
     * @notice The function to add the `uint256` constant to the contract
     * @dev Access: CREATE permission
     * @param key_ the mapping key to store the value_
     * @param value_ the `uint256` constant value to store under the key_
     */
    function addUint256(string calldata key_, uint256 value_) external;

    /**
     * @notice The function to add the `address` constant to the contract
     * @dev Access: CREATE permission
     * @param key_ the mapping key to store the value_
     * @param value_ the `address` constant value to store under the key_
     */
    function addAddress(string calldata key_, address value_) external;

    /**
     * @notice The function to add the `bytes32` constant to the contract
     * @dev Access: CREATE permission
     * @param key_ the mapping key to store the value_
     * @param value_ the `bytes32` constant value to store under the key_
     */
    function addBytes32(string calldata key_, bytes32 value_) external;

    /**
     * @notice The function to remove a variable from the contract
     * @dev Access: DELETE permission
     * @param key_ the key of the variable to delete
     */
    function remove(string calldata key_) external;

    /**
     * @notice The function to get the `bytes` constant which is stored under the key_
     * @param key_ the mapping key to get the `bytes` constant by
     * @return value_ the `bytes` constant value
     */
    function getBytes(string calldata key_) external view returns (bytes calldata value_);

    /**
     * @notice The function to get the `string` constant which is stored under the key_
     * @param key_ the mapping key to get the `string` constant by
     * @return value_ the `string` constant value
     */
    function getString(string calldata key_) external view returns (string calldata value_);

    /**
     * @notice The function to get the `uint256` constant which is stored under the key_
     * @param key_ the mapping key to get the `uint256` constant by
     * @return value_ the `uint256` constant value
     */
    function getUint256(string calldata key_) external view returns (uint256 value_);

    /**
     * @notice The function to get the `address` constant which is stored under the key_
     * @param key_ the mapping key to get the `address` constant by
     * @return value_ the `address` constant value
     */
    function getAddress(string calldata key_) external view returns (address value_);

    /**
     * @notice The function to get the `bytes32` constant which is stored under the key_
     * @param key_ the mapping key to get the `bytes32` constant by
     * @return value_ the `bytes32` constant value
     */
    function getBytes32(string calldata key_) external view returns (bytes32 value_);
}
