const { ApiError } = require("../utils/errors");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORTED_LANGUAGES = ["en", "hi", "mr", "bn", "ta", "te", "kn", "ml", "gu", "pa", "or"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateSignup(req, res, next) {
  const { email, password, name, phone, preferred_language } = req.body || {};
  const details = [];

  if (!isNonEmptyString(email) || !EMAIL_PATTERN.test(email.trim())) {
    details.push({ field: "email", message: "A valid email is required" });
  }

  if (!isNonEmptyString(password) || password.length < 8) {
    details.push({ field: "password", message: "Password must be at least 8 characters" });
  }

  if (name !== undefined && name !== null && typeof name !== "string") {
    details.push({ field: "name", message: "Name must be a string" });
  }

  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    details.push({ field: "phone", message: "Phone must be a string" });
  }

  if (
    preferred_language !== undefined &&
    preferred_language !== null &&
    !SUPPORTED_LANGUAGES.includes(preferred_language)
  ) {
    details.push({
      field: "preferred_language",
      message: `preferred_language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`,
    });
  }

  if (details.length) {
    return next(ApiError.badRequest("Validation failed", details));
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const details = [];

  if (!isNonEmptyString(email) || !EMAIL_PATTERN.test(email.trim())) {
    details.push({ field: "email", message: "A valid email is required" });
  }

  if (!isNonEmptyString(password)) {
    details.push({ field: "password", message: "Password is required" });
  }

  if (details.length) {
    return next(ApiError.badRequest("Validation failed", details));
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

module.exports = {
  validateSignup,
  validateLogin,
  SUPPORTED_LANGUAGES,
};
