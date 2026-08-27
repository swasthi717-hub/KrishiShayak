const { ApiError } = require("../utils/errors");
const { isUuid } = require("./farm.validator");

function validatePredictRequest(req, res, next) {
  const { farmId, cropId, overrides } = req.body || {};
  const details = [];

  if (!isUuid(farmId)) details.push({ field: "farmId", message: "A valid farmId is required" });
  if (!isUuid(cropId)) details.push({ field: "cropId", message: "A valid cropId is required" });
  if (overrides !== undefined && (typeof overrides !== "object" || overrides === null || Array.isArray(overrides))) {
    details.push({ field: "overrides", message: "overrides must be an object" });
  }

  if (details.length) return next(ApiError.badRequest("Validation failed", details));
  next();
}

function validatePredictionIdParam(req, res, next) {
  if (!isUuid(req.params.id)) return next(ApiError.badRequest("Invalid prediction id"));
  next();
}

module.exports = { validatePredictRequest, validatePredictionIdParam };