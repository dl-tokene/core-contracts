import { Deployer } from "@solarity/hardhat-migrate";
import { ethers } from "hardhat";
import type { Provider, TransactionReceipt } from "ethers";

import { DeterministicFactory__factory, MasterContractsRegistry__factory } from "@/generated-types";
import { generateDeterministicFactoryDeployTransaction } from "@/scripts/generateDFDeployTransaction";

const MAX_ATTEMPTS = 10;
const POLLING_INTERVAL_MS = 1000;

async function waitForTransactionReceipt(
  provider: Provider,
  txHash: string,
  maxAttempts: number = MAX_ATTEMPTS,
  pollingInterval: number = POLLING_INTERVAL_MS,
): Promise<TransactionReceipt> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt) {
      return receipt;
    }
    await new Promise((resolve) => setTimeout(resolve, pollingInterval));
  }

  throw new Error(`Transaction ${txHash} not found after ${maxAttempts} attempts`);
}

export = async (deployer: Deployer) => {
  const signer = await deployer.getSigner();
  const provider = ethers.provider;
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const txData = await generateDeterministicFactoryDeployTransaction();

  const tx = await signer.sendTransaction({
    to: txData.signerAddress,
    value: txData.gasLimit * txData.gasPrice,
  });
  await tx.wait();

  const txHash = await provider.send("eth_sendRawTransaction", [txData.transaction]);
  if (typeof txHash !== "string") {
    throw new Error("Failed to send raw transaction: invalid transaction hash");
  }

  await waitForTransactionReceipt(provider, txHash);

  const deterministicFactory = await deployer.deployed(DeterministicFactory__factory, txData.address);

  await registry.addContract(await registry.DETERMINISTIC_FACTORY_NAME(), deterministicFactory);
};
