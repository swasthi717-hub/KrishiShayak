const env = require("./config/env");
const createApp = require("./app");
const logger = require("./utils/logger");

const app = createApp();

app.listen(env.port, () => {
  logger.info(`KrishiSahayak API listening on port ${env.port}`);
});
