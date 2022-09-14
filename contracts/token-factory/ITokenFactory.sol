// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface ITokenFactory {
    enum RequestStatus {
        NONE,
        APPROVED,
        EXECUTED,
        EXPIRED
    }

    struct BaseDeploymentParams {
        address requester;
        uint64 deadline;
        RequestStatus status;
    }

    struct ERC20InitialParameters {
        address initHolder;
        uint256 initSupply;
        string name;
        string symbol;
    }

    struct DeploymentRequestERC20 {
        BaseDeploymentParams deploymentParams;
        ERC20InitialParameters tokenParams;
    }
}
