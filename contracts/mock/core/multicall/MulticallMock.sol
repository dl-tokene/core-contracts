// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Multicall} from "../../../core/multicall/Multicall.sol";

contract MulticallMock is Multicall {
    bytes[] public latestCallOutputs;

    function getMulticallExecutor() external view returns (address) {
        return address(_multicallExecutor);
    }

    function getLatestCallOutputs() external view returns (bytes[] memory) {
        return latestCallOutputs;
    }
}
