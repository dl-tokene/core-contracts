pragma solidity 0.8.16;

interface IRegistry {
    function getMasterRoleManagement() external view returns (address);

    function getTokenFactory() external view returns (address);
}
