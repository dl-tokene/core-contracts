const fs = require("fs");

const getConfigJson = () => {
  const configPath = process.env.CONFIG_FILE_PATH;

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file under path ${configPath} does not exist`);
  }

  const rawConfig = fs.readFileSync(configPath);

  return JSON.parse(rawConfig);
};

module.exports = {
  getConfigJson,
};
