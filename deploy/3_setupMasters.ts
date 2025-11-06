import { Deployer } from "@solarity/hardhat-migrate";

import { MasterAccessManagement__factory, MasterContractsRegistry__factory } from "@ethers-v6";

export = async (deployer: Deployer) => {
  const deployerAccount = await deployer.getSigner();

  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");
  const masterAccessImpl = await deployer.deployed(
    MasterAccessManagement__factory,
    "MasterAccessManagement Implementation",
  );

  const tx = await registry.__MasterContractsRegistry_init(masterAccessImpl);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Transaction receipt is null");
  }
  process.env.START_MIGRATIONS_BLOCK = receipt.blockNumber.toString();

  const masterAccess = await deployer.deployed(
    MasterAccessManagement__factory,
    await registry.getMasterAccessManagement(),
  );

  await masterAccess.__MasterAccessManagement_init(deployerAccount);
};
