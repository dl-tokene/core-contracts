import { Deployer } from "@solarity/hardhat-migrate";

import { MasterAccessManagement__factory } from "@ethers-v6";

export = async (deployer: Deployer) => {
  await deployer.deploy(MasterAccessManagement__factory, { name: "MasterAccessManagement Implementation" });
};
