import { Deployer } from "@solarity/hardhat-migrate";

import { ERC1967Proxy__factory, MasterContractsRegistry__factory } from "@ethers-v6";

export = async (deployer: Deployer) => {
  const registry = await deployer.deploy(MasterContractsRegistry__factory);

  await deployer.deploy(ERC1967Proxy__factory, [await registry.getAddress(), "0x"], {
    name: "MasterContractsRegistry Proxy",
  });
};
