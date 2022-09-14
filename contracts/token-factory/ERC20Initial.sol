// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Initial is ERC20 {
    constructor(
        address initialSupplyHolder_,
        uint256 initialSupply_,
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        _mint(initialSupplyHolder_, initialSupply_);
    }
}
