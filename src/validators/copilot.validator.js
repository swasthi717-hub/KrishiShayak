const { ApiError } = require("../utils/errors");
const { isUuid } = require("./farm.validator");
const { SUPPORTED_LANGUAGES } = require("./auth.validator");

function validateSendMessage(req, res, next) {
  const { message, conversationId, language } = req.body || {};
  const details = [];

  if (typeof message !== "string" || !message.trim()) {
    details.push({ field: "message", message: "message is required" });
  } else if (message.length > 2000) {
    details.push({ field: "message", message: "message must be under 2000 characters" });
  }

  if (conversationId !== undefined && conversationId !== null && !isUuid(conversationId)) {
    details.push({ field: "conversationId", message: "conversationId must be a valid UUID" });
  }

  if (language !== undefined && language !== null && !SUPPORTED_LANGUAGES.includes(language)) {
    details.push({ field: "language", message: `language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}` });
  }

  if (details.length) return next(ApiError.badRequest("Validation failed", details));
  next();
}

function validateConversationIdParam(req, res, next) {
  if (!isUuid(req.params.id)) return next(ApiError.badRequest("Invalid conversation id"));
  next();
}

module.exports = { validateSendMessage, validateConversationIdParam };