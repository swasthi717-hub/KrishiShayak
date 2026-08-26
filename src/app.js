const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const env = require("./config/env");
const apiRoutes = require("./routes");
const { apiLimiter } = require("./middleware/rateLimit.middleware");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(",").map((value) => value.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(apiLimiter);

  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
