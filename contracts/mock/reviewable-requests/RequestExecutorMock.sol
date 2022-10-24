// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract RequestExecutorMock {
    uint256 public status;

    function requestRevert() external pure {
        revert();
    }

    function requestAccept() external {
        status = 1;
    }

    function requestReject() external {
        status = 2;
    }
}
