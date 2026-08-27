const { ApiError } = require("../utils/errors");
const { isUuid } = require("./farm.validator");

function validateWhatIfRequest(req, res, next) {
  const { farmId, cropId, overrides } = req.body || {};
  const details = [];

  if (!isUuid(farmId)) details.push({ field: "farmId", message: "A valid farmId is required" });
  if (!isUuid(cropId)) details.push({ field: "cropId", message: "A valid cropId is required" });
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    details.push({ field: "overrides", message: "overrides object is required, e.g. { extra_rainfall_mm: 20 }" });
  }

  if (details.length) return next(ApiError.badRequest("Validation failed", details));
  next();
}

module.exports = { validateWhatIfRequest };