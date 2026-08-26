const { ApiError } = require("../utils/errors");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const AREA_UNITS = ["acre", "hectare", "bigha", "guntha", "sq_m"];

const FARM_FIELDS = [
  "farm_name",
  "area",
  "area_unit",
  "latitude",
  "longitude",
  "state",
  "district",
  "village",
  "soil_type",
  "irrigation_type",
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

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function collectFarmFieldErrors(body, { requireName }) {
  const details = [];

  if (Object.prototype.hasOwnProperty.call(body, "user_id") || Object.prototype.hasOwnProperty.call(body, "id")) {
    details.push({ field: "user_id", message: "Ownership fields cannot be set from the request body" });
  }

  const unknown = Object.keys(body).filter(
    (key) => !FARM_FIELDS.includes(key) && key !== "user_id" && key !== "id"
  );
  if (unknown.length) {
    details.push({ field: unknown.join(", "), message: "Unknown or unsupported fields" });
  }

  if (requireName) {
    if (typeof body.farm_name !== "string" || !body.farm_name.trim()) {
      details.push({ field: "farm_name", message: "farm_name is required" });
    }
  } else if (body.farm_name !== undefined && (typeof body.farm_name !== "string" || !body.farm_name.trim())) {
    details.push({ field: "farm_name", message: "farm_name must be a non-empty string" });
  }

  ["state", "district", "village", "soil_type", "irrigation_type"].forEach((field) => {
    if (!isOptionalString(body[field])) {
      details.push({ field, message: `${field} must be a string` });
    }
  });

  if (!isOptionalNumber(body.area)) {
    details.push({ field: "area", message: "area must be a number" });
  } else if (typeof body.area === "number" && body.area < 0) {
    details.push({ field: "area", message: "area cannot be negative" });
  }

  if (body.area_unit !== undefined && body.area_unit !== null && !AREA_UNITS.includes(body.area_unit)) {
    details.push({
      field: "area_unit",
      message: `area_unit must be one of: ${AREA_UNITS.join(", ")}`,
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

  return details;
}

function validateCreateFarm(req, res, next) {
  const details = collectFarmFieldErrors(req.body || {}, { requireName: true });
  if (details.length) {
    return next(ApiError.badRequest("Validation failed", details));
  }
  next();
}

function validateUpdateFarm(req, res, next) {
  const details = collectFarmFieldErrors(req.body || {}, { requireName: false });
  if (details.length) {
    return next(ApiError.badRequest("Validation failed", details));
  }
  next();
}

function validateFarmIdParam(req, res, next) {
  if (!isUuid(req.params.id)) {
    return next(ApiError.badRequest("Invalid farm id"));
  }
  next();
}

module.exports = {
  AREA_UNITS,
  FARM_FIELDS,
  UUID_PATTERN,
  isUuid,
  isOptionalString,
  isOptionalNumber,
  validateCreateFarm,
  validateUpdateFarm,
  validateFarmIdParam,
};
