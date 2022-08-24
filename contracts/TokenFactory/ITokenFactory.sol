pragma solidity 0.8.16;

interface ITokenFactory {
    enum RequestStatus {
        NONE,
        APPROVED,
        EXECUTED
    }

    struct DeploymentRequest {
        address requester;
        uint64 deadline;
        RequestStatus status;
    }
}
