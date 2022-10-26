const fs = require("fs");

const getConfigJson = () => {
  const rawConfig = fs.readFileSync(process.env.CONFIG_FILE_PATH);

  return JSON.parse(rawConfig);
};

module.exports = {
  getConfigJson,
};
