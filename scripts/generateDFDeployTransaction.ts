import { ethers } from "hardhat";
import { wei } from "./utils/utils";
import { DeterministicFactory__factory } from "@/generated-types";

export async function generateDeterministicFactoryDeployTransaction() {
  const deploymentGas = 20000000; // actual gas costs last measure: 183257; // TODO: change to actual gas costs

  const nonce = new Uint8Array(0);
  const gasPrice = arrayFromNumber(wei(100, 9));
  const gasLimit = arrayFromNumber(deploymentGas);
  const to = new Uint8Array(0);
  const value = new Uint8Array(0);
  const data = arrayFromHexString(DeterministicFactory__factory.bytecode.slice(2));
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
    gasPrice: 100000000000,
    gasLimit: deploymentGas,
    signerAddress: signerAddress,
    transaction: signedEncodedTransaction,
    address: `0x${contractAddress}`,
  };
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
