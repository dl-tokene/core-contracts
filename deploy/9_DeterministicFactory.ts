import { Deployer } from "@solarity/hardhat-migrate";

import { DeterministicFactory__factory, MasterContractsRegistry__factory } from "@/generated-types";
import { generateDeterministicFactoryDeployTransaction } from "@/scripts/generateDFDeployTransaction";
import { ethers } from "hardhat";

export = async (deployer: Deployer) => {
  const signer = await deployer.getSigner();
  const provider = ethers.provider;
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const txData = await generateDeterministicFactoryDeployTransaction();

  await signer.sendTransaction({
    to: txData.signerAddress,
    value: BigInt(txData.gasLimit) * BigInt(txData.gasPrice),
  });

  const txReceipt = await provider.send("eth_sendRawTransaction", [txData.transaction]);
  const _ = await provider.getTransactionReceipt(txReceipt);

  const deterministicFactory = await deployer.deployed(DeterministicFactory__factory, txData.address);

  await registry.addContract(await registry.DETERMINISTIC_FACTORY_NAME(), deterministicFactory);
};
