import { Deployer } from "@solarity/hardhat-migrate";

import { ConstantsRegistry__factory, MasterContractsRegistry__factory } from "@/generated-types";

import { getConfigJson } from "./config/config-parser";

export = async (deployer: Deployer) => {
  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");
  const constantsRegistry = await deployer.deployed(ConstantsRegistry__factory, await registry.getConstantsRegistry());

  const constantsConfig = getConfigJson().constants;

  if (constantsConfig == undefined) {
    return;
  }

  const constants = Object.keys(constantsConfig);

  for (let i = 0; i < constants.length; i++) {
    const constant = constants[i];
    const constantType = constantsConfig[constant].type;
    const constantValue = constantsConfig[constant].value;

    if (constantValue == undefined || constantType == undefined) {
      throw new Error(`Constant ${constant} is incorrectly specified`);
    }

    if (constantType == "bytes" && constantValue == "0x") {
      throw new Error(`Constant ${constant} value is empty`);
    }

    switch (constantType) {
      case "bytes":
        await constantsRegistry.addBytes(constant, constantValue);
        break;
      case "string":
        await constantsRegistry.addString(constant, constantValue);
        break;
      case "uint256":
        await constantsRegistry.addUint256(constant, constantValue);
        break;
      case "address":
        await constantsRegistry.addAddress(constant, constantValue);
        break;
      case "bytes32":
        await constantsRegistry.addBytes32(constant, constantValue);
        break;
      default:
        throw new Error(`Constant ${constant} has invalid type ${constantType}`);
    }
  }
};
