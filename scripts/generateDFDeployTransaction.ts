import { ethers } from "hardhat";
import { DeterministicFactory__factory } from "@/generated-types";

const GAS_INCREASE_PERCENT = 200n;

export async function generateDeterministicFactoryDeployTransaction() {
  const bytecode = DeterministicFactory__factory.bytecode;

  const deploymentGas = await getDeployedGas(bytecode);
  const nonce = new Uint8Array(0);
  const gasPrice = arrayFromNumber(deploymentGas.gasPrice);
  const gasLimit = arrayFromNumber(deploymentGas.gasLimit);
  const to = new Uint8Array(0);
  const value = new Uint8Array(0);
  const data = arrayFromHexString(bytecode.slice(2));
  const v = arrayFromNumber(27);
  const r = "2222222222222222222222222222222222222222222222222222222222222222";
  const s = "2222222222222222222222222222222222222222222222222222222222222222";

  const signature = ethers.Signature.from({
    r: `0x${r}`,
    s: `0x${s}`,
    yParity: 0,
  });

  const unsignedEncodedTransaction = ethers.encodeRlp([nonce, gasPrice, gasLimit, to, value, data]);
  const signedEncodedTransaction = ethers.encodeRlp([
    nonce,
    gasPrice,
    gasLimit,
    to,
    value,
    data,
    v,
    arrayFromHexString(r),
    arrayFromHexString(s),
  ]);
  const hashedSignedEncodedTransaction = ethers.keccak256(unsignedEncodedTransaction);

  const signerAddress = ethers.computeAddress(
    ethers.SigningKey.recoverPublicKey(hashedSignedEncodedTransaction, signature),
  );

  const contractAddress = ethers.keccak256(ethers.encodeRlp([signerAddress, nonce])).slice(-40);

  return {
    gasPrice: deploymentGas.gasPrice,
    gasLimit: deploymentGas.gasLimit,
    signerAddress: signerAddress,
    transaction: signedEncodedTransaction,
    address: `0x${contractAddress}`,
  };
}

async function getDeployedGas(bytecode: string): Promise<{ gasPrice: bigint; gasLimit: bigint }> {
  const estimatedGas = await ethers.provider.estimateGas({ data: bytecode });

  const { gasPrice } = await ethers.provider.getFeeData();
  if (!gasPrice) {
    throw new Error("Gas price is not available");
  }

  return { gasPrice: (gasPrice * (100n + GAS_INCREASE_PERCENT)) / 100n, gasLimit: estimatedGas };
}

function arrayFromNumber(value: number | bigint): Uint8Array {
  return arrayFromHexString(value.toString(16));
}

function arrayFromHexString(value: string): Uint8Array {
  const normalized = value.length % 2 ? `0${value}` : value;
  const bytes = [];
  for (let i = 0; i < normalized.length; i += 2) {
    bytes.push(Number.parseInt(`${normalized[i]}${normalized[i + 1]}`, 16));
  }
  return new Uint8Array(bytes);
}
