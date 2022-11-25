const MasterAccessManagement = artifacts.require("MasterAccessManagement");

module.exports = async (deployer) => {
  await deployer.deploy(MasterAccessManagement);
};
