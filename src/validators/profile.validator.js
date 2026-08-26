const { ApiError } = require("../utils/errors");
const { SUPPORTED_LANGUAGES } = require("./auth.validator");

const ALLOWED_FIELDS = [
  "name",
  "phone",
  "preferred_language",
  "state",
  "district",
  "village",
  "latitude",
  "longitude",
];

function isOptionalString(value) {
  return value === undefined || value === null || typeof value === "string";
}

function isOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return true;
  }
  return typeof value === "number" && Number.isFinite(value);
}

function validateProfileUpdate(req, res, next) {
  const body = req.body || {};
  const details = [];

  if (Object.prototype.hasOwnProperty.call(body, "user_id")) {
    details.push({ field: "user_id", message: "user_id cannot be set from the request body" });
  }

  const unknown = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key) && key !== "user_id");
  if (unknown.length) {
    details.push({ field: unknown.join(", "), message: "Unknown or unsupported fields" });
  }

  ["name", "phone", "state", "district", "village"].forEach((field) => {
    if (!isOptionalString(body[field])) {
      details.push({ field, message: `${field} must be a string` });
    }
  });

  if (
    body.preferred_language !== undefined &&
    body.preferred_language !== null &&
    !SUPPORTED_LANGUAGES.includes(body.preferred_language)
  ) {
    details.push({
      field: "preferred_language",
      message: `preferred_language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`,
    });
  }

  ["latitude", "longitude"].forEach((field) => {
    if (!isOptionalNumber(body[field])) {
      details.push({ field, message: `${field} must be a number` });
    }
  });

  if (typeof body.latitude === "number" && (body.latitude < -90 || body.latitude > 90)) {
    details.push({ field: "latitude", message: "latitude must be between -90 and 90" });
  }

  if (typeof body.longitude === "number" && (body.longitude < -180 || body.longitude > 180)) {
    details.push({ field: "longitude", message: "longitude must be between -180 and 180" });
  }

  if (details.length) {
    return next(ApiError.badRequest("Validation failed", details));
  }

  next();
}

module.exports = {
  validateProfileUpdate,
  ALLOWED_FIELDS,
};
