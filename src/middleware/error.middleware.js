const env = require("../config/env");
const logger = require("../utils/logger");
const { ApiError } = require("../utils/errors");

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const isProd = env.nodeEnv === "production";
  const message =
    statusCode === 500 && isProd ? "Internal server error" : err.message || "Internal server error";

  logger.error(message, err.stack || err);

  const payload = {
    success: false,
    message,
  };

  if (err.details) {
    payload.errors = err.details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
