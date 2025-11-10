import { Deployer } from "@solarity/hardhat-migrate";

import { ApiResponseError } from "node-vault";

import { getConfigJson } from "./config/config-parser";

import { MasterContractsRegistry__factory } from "@/generated-types";

export = async (deployer: Deployer) => {
  if (process.env.VAULT_DISABLED && process.env.VAULT_DISABLED === "true") return;
  const vault = require("node-vault")({
    apiVersion: "v1",
    endpoint: process.env.VAULT_ENDPOINT,
    token: process.env.VAULT_TOKEN,
  });

  const registry = await deployer.deployed(MasterContractsRegistry__factory, "MasterContractsRegistry Proxy");

  const masterAccessAddress = await registry.getMasterAccessManagement();
  const constantsRegistryAddress = await registry.getConstantsRegistry();
  const reviewableRequestsAddress = await registry.getReviewableRequests();
  const multicallAddress = await registry.getMulticall();
  const approveContractRequestsAddress = await registry.getApproveContractRequests();
  const whitelistedContractRegistryAddress = await registry.getWhitelistedContractRegistry();
  const deterministicFactoryAddress = await registry.getDeterministicFactory();
  const nativeTokenRequestManagerAddress = await registry.getNativeTokenRequestManager();

  const projectName = getConfigJson().projectName;

  if (projectName == undefined) {
    throw new Error("uploadToVault: projectName is undefined");
  }

  const startBlock = process.env.START_MIGRATIONS_BLOCK;

  if (startBlock == undefined) {
    throw new Error("uploadToVault: startBlock is undefined");
  }

  const config = {
    projectName: projectName,
    addresses: {
      ConstantsRegistry: constantsRegistryAddress,
      MasterContractsRegistry: await registry.getAddress(),
      MasterAccessManagement: masterAccessAddress,
      ReviewableRequests: reviewableRequestsAddress,
      Multicall: multicallAddress,
      ApproveContractRequests: approveContractRequestsAddress,
      WhitelistedContractRegistry: whitelistedContractRegistryAddress,
      DeterministicFactory: deterministicFactoryAddress,
      NativeTokenRequestManager: nativeTokenRequestManagerAddress,
    },
    startBlock: parseInt(startBlock, 10),
  };

  try {
    await vault.write(process.env.VAULT_UPLOAD_CONFIG_PATH, { data: config });
  } catch (error) {
    if ((error as ApiResponseError).response) {
      console.log((error as ApiResponseError).response.body.errors);
    } else {
      console.log(error);
    }
  }
};
