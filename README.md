# The TokenE operating system on top of EVM by Distributed Lab

This repository represents the core smart contracts part of the operating system.

## What

The TokenE core consists of 9 main smart contracts:

1. `MasterContractsRegistry`
1. `MasterAccessManagement`
1. `ReviewableRequests`
1. `ConstantRegistry`
1. `Multicall`
1. `ApproveContractRequests`
1. `WhitelistedContractRegistry`
1. `NativeTokenRequestManager`
1. `DeterministicFactory`

Each of these contracts serves an important role for the system:

- The `MasterContractsRegistry` is an [ERC-6224](https://eips.ethereum.org/EIPS/eip-6224) compliant contract that is used throughout the core and its modules.
- The `MasterAccessManagement` is used to handle permissions and access, leveraging [solarity](https://github.com/dl-solarity/solidity-lib) RBAC smart contract.
- The `ReviewableRequests` is a primary integration tool that is used to "speak" with admins. One can issue tokens or pass KYC requests via that contract.
- The `ConstantRegistry` that stores the system-wide parameters.
- The `Multicall` is used as a utility to execute batches of transactions.
- The `ApproveContractRequests` is used to forward user incentives to add contracts to the whitelist.
- The `WhitelistedContractRegistry` is used to manage the whitelisted contracts.
- The `NativeTokenRequestManager` is used to request minting and burning of native tokens.
- The `DeterministicFactory` is used to deploy contracts deterministically.

## Installation

The core contracts are available as an npm package:

```console
$ npm install @tokene/core-contracts
```

Or if you want to use the low-level [solarity](https://github.com/dl-solarity/solidity-lib):

```console
$ npm install @solarity/solidity-lib
```

## Integration

Once you have installed the packages, feel free to play around with them.

In order to integrate with TokenE core, please check that you are aware of these things:

- Your module has to be dockerized. The smart contract, scripts, and deployments must be included in the docker image.
- TokenE is a role based system, the external access control must integrated with `MasterAccessManagement` contract.
- Double check that the RBAC resource does not collide with the any existing one.
- Your smart contract must be discoverable by the system. It means that you will have to add them to the `MasterContractsRegistry` in the deployment scripts.
- You must never create reviewable requests directly, always use the appropriate module for that. If you are writing such module, make sure it is able to handle both "accept" and "reject" request cases.

## Documentation

You can find an extensive documentation of the protocol [here](https://docs.tokene.io/docs/intro).

## License

The TokenE core is released under the custom License. Please take a look to understand the limitations.
