import { Deployer } from "@solarity/hardhat-migrate";

import { MasterContractsRegistry__factory, ApproveContractRequests__factory } from "@/generated-types";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const approveContractRequests = await deployer.deploy(ApproveContractRequests__factory);

  await registry.addProxyContract(
    await registry.APPROVE_CONTRACT_REQUESTS_NAME(),
    approveContractRequests.getAddress(),
  );
};
