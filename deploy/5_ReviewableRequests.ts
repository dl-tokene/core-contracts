import { Deployer } from "@solarity/hardhat-migrate";

import { MasterContractsRegistry__factory, ReviewableRequests__factory } from "@ethers-v6";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const reviewableRequests = await deployer.deploy(ReviewableRequests__factory);

  await registry.addProxyContract(await registry.REVIEWABLE_REQUESTS_NAME(), await reviewableRequests.getAddress());
};
