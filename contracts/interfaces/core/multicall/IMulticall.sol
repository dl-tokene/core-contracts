// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IMulticall {
    /**
     * @notice The function that executes function calls on passed targets
     * @param targets_ the list of targets to call the corresponding functions on
     * @param data_ the list of functions to call
     * @return outputs_ the list of function call results
     */
    function multicall(
        address[] calldata targets_,
        bytes[] calldata data_
    ) external returns (bytes[] memory outputs_);

    /**
     * @notice The function that executes function calls on passed targets. It also transfers
     * the corresponding ETH amounts to the targets
     * @param targets_ the list of targets to call the corresponding functions on
     * @param data_ the list of functions to call
     * @param values_ the list of ETH amounts to transfer to the corresponding targets
     * @return outputs_ the list of function call results
     */
    function multicallWithValues(
        address[] calldata targets_,
        bytes[] calldata data_,
        uint256[] calldata values_
    ) external payable returns (bytes[] memory outputs_);
}
