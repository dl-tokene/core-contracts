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
  const roleManagedRegistryAddress = await registry.getRoleManagedRegistry();

  const projectName = getConfigJson().projectName;
  if (!projectName) {
    throw new Error("uploadToVault: projectName is undefined");
  }
  const config = {
    projectName: projectName,
    address: {
      ConstantsRegistry: constantsRegistryAddress,
      RoleManagedRegistry: roleManagedRegistryAddress,
      MasterAccessManagement: masterAccessAddress,
      ReviewableRequests: reviewableRequestsAddress,
    },
    startBlock: deployer.startMigrationsBlock,
  };

  await vault.write(process.env.VAULT_CONFIG_PATH, { data: config });
};
