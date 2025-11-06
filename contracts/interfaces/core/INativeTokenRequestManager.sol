// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface INativeTokenRequestManager {
    event MintRequested(address indexed recipient, uint256 amount);
    event BurnRequested();

    /**
     * @notice Request a mint native token operation
     * @param recipient_ The address that will receive tokens
     * @param amount_ The amount of tokens to mint
     */
    function mint(address recipient_, uint256 amount_) external;

    /**
     * @notice Request a burn native token operation
     */
    function burn() external payable;
}
