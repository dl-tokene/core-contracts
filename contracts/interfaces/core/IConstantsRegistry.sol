// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IConstantsRegistry {
    function addConstant(string calldata key_, bytes calldata value_) external;

    function removeConstant(string calldata key_) external;
}
