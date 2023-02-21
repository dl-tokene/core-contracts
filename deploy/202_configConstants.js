const { getConfigJson } = require("./config/config-parser");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const ConstantsRegistry = artifacts.require("ConstantsRegistry");

module.exports = async (deployer, logger) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const constantsRegistry = await ConstantsRegistry.at(await registry.getConstantsRegistry());

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
        logger.logTransaction(
          await constantsRegistry.addBytes(constant, constantValue),
          `Added constant ${constant} with value ${constantValue}`
        );
        break;
      case "string":
        logger.logTransaction(
          await constantsRegistry.addString(constant, constantValue),
          `Added constant ${constant} with value ${constantValue}`
        );
        break;
      case "uint256":
        logger.logTransaction(
          await constantsRegistry.addUint256(constant, constantValue),
          `Added constant ${constant} with value ${constantValue}`
        );
        break;
      case "address":
        logger.logTransaction(
          await constantsRegistry.addAddress(constant, constantValue),
          `Added constant ${constant} with value ${constantValue}`
        );
        break;
      case "bytes32":
        logger.logTransaction(
          await constantsRegistry.addBytes32(constant, constantValue),
          `Added constant ${constant} with value ${constantValue}`
        );
        break;
      default:
        throw new Error(`Constant ${constant} has invalid type ${constantType}`);
    }
  }
};
