import * as fs from "node:fs";

export const getConfigJson = () => {
  const configPath = process.env.CONFIG_FILE_PATH;

  if (!configPath) {
    throw new Error("CONFIG_FILE_PATH environment variable is not set");
  }

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file under path ${configPath} does not exist`);
  }

  const rawConfig = fs.readFileSync(configPath, "utf8");

  return JSON.parse(rawConfig);
};
