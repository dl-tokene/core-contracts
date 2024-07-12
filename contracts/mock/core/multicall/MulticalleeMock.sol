// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {TypeCaster} from "@solarity/solidity-lib/libs/utils/TypeCaster.sol";

import {IMulticall} from "../../../interfaces/core/multicall/IMulticall.sol";
import {IMasterAccessManagement} from "../../../interfaces/core/IMasterAccessManagement.sol";

contract MulticalleeMock {
    using TypeCaster for *;

    string public constant MULTICALLEE_MOCK_RESOURCE = "MULTICALLEE_MOCK_RESOURCE";
    string public constant CALL_PERMISSION = "CALL_PERMISSION";

    IMulticall public immutable FACADE;
    IMasterAccessManagement public immutable MASTER_ACCESS;

    uint256 public counter;

    modifier onlyCallPermission() {
        require(hasMulticalleeMockCallPermission(msg.sender), "MulticalleeMock: access denied");
        _;
    }

    constructor(address multicall_, address masterAccess_) {
        FACADE = IMulticall(multicall_);
        MASTER_ACCESS = IMasterAccessManagement(masterAccess_);
    }

    function addOneWithoutRole() external {
        ++counter;
    }

    function addArgumentWithRole(uint256 argument_) external onlyCallPermission {
        counter += argument_;
    }

    function addMsgValueWithRole() external payable onlyCallPermission {
        counter += msg.value;
    }

    function attack() external {
        bytes[] memory data_ = new bytes[](1);
        data_[0] = abi.encodeCall(this.addArgumentWithRole, (11));

        FACADE.multicall(address(this).asSingletonArray(), data_);
    }

    function attackWithValue() external payable {
        bytes[] memory data_ = new bytes[](1);
        data_[0] = abi.encodeCall(this.addMsgValueWithRole, ());

        FACADE.multicallWithValues{value: msg.value}(
            address(this).asSingletonArray(),
            data_,
            msg.value.asSingletonArray()
        );
    }

    function hasMulticalleeMockCallPermission(address account_) public view returns (bool) {
        return MASTER_ACCESS.hasPermission(account_, MULTICALLEE_MOCK_RESOURCE, CALL_PERMISSION);
    }
}
