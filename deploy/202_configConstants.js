const { logTransaction } = require("@dlsl/hardhat-migrate");
const { getConfigJson } = require("./config/config-parser");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const ConstantsRegistry = artifacts.require("ConstantsRegistry");

module.exports = async () => {
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

    const constantEncodedValue = web3.eth.abi.encodeParameters([constantType], [constantValue]);

    if (constantEncodedValue == "0x") {
      throw new Error(`Consant ${constant} value is empty`);
    }

    logTransaction(
      await constantsRegistry.addConstant(constant, constantEncodedValue),
      `Added constant ${constant} with value ${constantEncodedValue}`
    );
  }
};
