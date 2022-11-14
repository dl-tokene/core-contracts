const vault = require("node-vault")({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ENDPOINT,
  token: process.env.VAULT_TOKEN,
});

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const ConstantsRegistry = artifacts.require("ConstantsRegistry");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");
const ReviewableRequests = artifacts.require("ReviewableRequests");
const RoleManagedRegistry = artifacts.require("RoleManagedRegistry");

module.exports = async () => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());
  const constantsRegistry = await ConstantsRegistry.at(await registry.getConstantsRegistry());
  const reviewableRequests = await ReviewableRequests.at(await registry.getReviewableRequests());
  const roleManagedRegistry = await RoleManagedRegistry.at(await registry.getRoleManagedRegistry());

  const config = {
    projectName: getConfigJson().projectName,
    address: {
      ConstantsRegistry: constantsRegistry.address,
      RoleManagedRegistry: roleManagedRegistry.address,
      MasterAccessManagement: masterAccess.address,
      ReviewableRequests: reviewableRequests.address,
    },
    startBlock: await web3.eth.getBlockNumber(),
  };

  await vault.write(process.env.VAULT_CONFIG_PATH, { data: config });
};
