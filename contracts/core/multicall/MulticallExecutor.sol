// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Address.sol";

import "../../interfaces/core/multicall/IMulticall.sol";

/**
 * @notice The MulticallExecutor contract. Its purpose is to execute a batch of functions.
 * This contract is a part of the facade Multicall contract and can be called only by it.
 */
contract MulticallExecutor is IMulticall {
    using Address for address;

    address private immutable _FACADE;

    modifier onlyFacade() {
        require(msg.sender == _FACADE, "MulticallExecutor: caller is not the facade");
        _;
    }

    constructor() {
        _FACADE = msg.sender;
    }

    /**
     * @inheritdoc IMulticall
     */
    function multicall(
        address[] calldata targets_,
        bytes[] calldata data_
    ) external override onlyFacade returns (bytes[] memory outputs_) {
        outputs_ = new bytes[](targets_.length);

        for (uint256 i = 0; i < outputs_.length; ++i) {
            outputs_[i] = targets_[i].functionCall(data_[i]);
        }
    }

    /**
     * @inheritdoc IMulticall
     */
    function multicallWithValues(
        address[] calldata targets_,
        bytes[] calldata data_,
        uint256[] calldata values_
    ) external payable override onlyFacade returns (bytes[] memory outputs_) {
        outputs_ = new bytes[](targets_.length);

        for (uint256 i = 0; i < outputs_.length; ++i) {
            outputs_[i] = targets_[i].functionCallWithValue(data_[i], values_[i]);
        }
    }
}
