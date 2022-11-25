const { logTransaction } = require("@dlsl/hardhat-migrate");

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const ReviewableRequests = artifacts.require("ReviewableRequests");

module.exports = async (deployer) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);

  const reviewableRequests = await deployer.deploy(ReviewableRequests);

  logTransaction(
    await registry.addProxyContract(await registry.REVIEWABLE_REQUESTS_NAME(), reviewableRequests.address),
    "Deploy ReviewableRequests"
  );
};
