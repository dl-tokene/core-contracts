const { getConfigJson } = require("./config/config-parser");

const vault = require("node-vault")({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ENDPOINT,
  token: process.env.VAULT_TOKEN,
});

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");

module.exports = async (deployer) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterAccessAddress = await registry.getMasterAccessManagement();
  const constantsRegistryAddress = await registry.getConstantsRegistry();
  const reviewableRequestsAddress = await registry.getReviewableRequests();

  const projectName = getConfigJson().projectName;

  if (projectName == undefined) {
    throw new Error("uploadToVault: projectName is undefined");
  }

  const config = {
    projectName: projectName,
    addresses: {
      ConstantsRegistry: constantsRegistryAddress,
      MasterContractsRegistry: registry.address,
      MasterAccessManagement: masterAccessAddress,
      ReviewableRequests: reviewableRequestsAddress,
    },
    startBlock: deployer.startMigrationsBlock,
  };

  await vault.write(process.env.VAULT_UPLOAD_CONFIG_PATH, { data: config });
};
