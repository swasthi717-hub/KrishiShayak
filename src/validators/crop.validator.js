const { ApiError } = require("../utils/errors");
const { isUuid, isOptionalString, isOptionalNumber } = require("./farm.validator");

const CROP_FIELDS = [
  "farm_id",
  "crop_name",
  "variety",
  "sowing_date",
  "expected_harvest_date",
  "growth_stage",
  "acreage",
  "previous_yield",
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isOptionalDate(value) {
  if (value === undefined || value === null || value === "") {
    return true;
  }
  return typeof value === "string" && DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

function collectCropFieldErrors(body, { requireCreate }) {
  const details = [];

  if (Object.prototype.hasOwnProperty.call(body, "user_id") || Object.prototype.hasOwnProperty.call(body, "id")) {
    details.push({ field: "user_id", message: "Ownership fields cannot be set from the request body" });
  }

  const unknown = Object.keys(body).filter(
    (key) => !CROP_FIELDS.includes(key) && key !== "user_id" && key !== "id"
  );
  if (unknown.length) {
    details.push({ field: unknown.join(", "), message: "Unknown or unsupported fields" });
  }

  if (requireCreate) {
    if (!isUuid(body.farm_id)) {
      details.push({ field: "farm_id", message: "A valid farm_id is required" });
    }
    if (typeof body.crop_name !== "string" || !body.crop_name.trim()) {
      details.push({ field: "crop_name", message: "crop_name is required" });
    }
  } else {
    if (body.farm_id !== undefined && !isUuid(body.farm_id)) {
      details.push({ field: "farm_id", message: "farm_id must be a valid UUID" });
    }
    if (body.crop_name !== undefined && (typeof body.crop_name !== "string" || !body.crop_name.trim())) {
      details.push({ field: "crop_name", message: "crop_name must be a non-empty string" });
    }
  }

  ["variety", "growth_stage"].forEach((field) => {
    if (!isOptionalString(body[field])) {
      details.push({ field, message: `${field} must be a string` });
    }
  });

  ["sowing_date", "expected_harvest_date"].forEach((field) => {
    if (!isOptionalDate(body[field])) {
      details.push({ field, message: `${field} must be a date in YYYY-MM-DD format` });
    }
  });

  if (
    typeof body.sowing_date === "string" &&
    typeof body.expected_harvest_date === "string" &&
    DATE_PATTERN.test(body.sowing_date) &&
    DATE_PATTERN.test(body.expected_harvest_date) &&
    body.expected_harvest_date < body.sowing_date
  ) {
    details.push({
      field: "expected_harvest_date",
      message: "expected_harvest_date cannot be before sowing_date",
    });
  }

  ["acreage", "previous_yield"].forEach((field) => {
    if (!isOptionalNumber(body[field])) {
      details.push({ field, message: `${field} must be a number` });
    } else if (typeof body[field] === "number" && body[field] < 0) {
      details.push({ field, message: `${field} cannot be negative` });
    }
  });

  return details;
}

function validateCreateCrop(req, res, next) {
  const details = collectCropFieldErrors(req.body || {}, { requireCreate: true });
  if (details.length) {
    return next(ApiError.badRequest("Validation failed", details));
  }
  next();
}

function validateUpdateCrop(req, res, next) {
  const details = collectCropFieldErrors(req.body || {}, { requireCreate: false });
  if (details.length) {
    return next(ApiError.badRequest("Validation failed", details));
  }
  next();
}

function validateCropIdParam(req, res, next) {
  if (!isUuid(req.params.id)) {
    return next(ApiError.badRequest("Invalid crop id"));
  }
  next();
}

function validateCropQuery(req, res, next) {
  if (req.query.farmId && !isUuid(req.query.farmId)) {
    return next(ApiError.badRequest("Invalid farmId"));
  }
  next();
}

module.exports = {
  CROP_FIELDS,
  validateCreateCrop,
  validateUpdateCrop,
  validateCropIdParam,
  validateCropQuery,
};
