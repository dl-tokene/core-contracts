import { NativeTokenRequestManager__factory } from "@/generated-types";
import { ethers } from "hardhat";
import { generateDeterministicFactoryDeployTransaction } from "./generateDFDeployTransaction";

const deployerAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";

async function calculateNTRMAddress() {
  const salt = ethers.id("NativeTokenRequestManager");
  const { address: deterministicFactoryAddress } = await generateDeterministicFactoryDeployTransaction();

  const deploymentSalt = ethers.solidityPackedKeccak256(["address", "bytes32"], [deployerAddress, salt]);

  const expectedAddress = ethers.getCreate2Address(
    deterministicFactoryAddress,
    deploymentSalt,
    ethers.keccak256(NativeTokenRequestManager__factory.bytecode),
  );

  console.log(`NativeTokenRequestManager for ${deployerAddress} is: ${expectedAddress}`);
}

calculateNTRMAddress().catch(console.error);

// npx hardhat run scripts/calculateNTRMAddress.ts
