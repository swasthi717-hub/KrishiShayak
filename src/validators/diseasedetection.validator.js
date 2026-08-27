const { ApiError } = require("../utils/errors");
const { isUuid } = require("./farm.validator");

function validateSubmitScan(req, res, next) {
  const { cropId } = req.body || {};
  if (cropId !== undefined && cropId !== null && cropId !== "" && !isUuid(cropId)) {
    return next(ApiError.badRequest("Validation failed", [{ field: "cropId", message: "cropId must be a valid UUID" }]));
  }
  next();
}

function validateScanIdParam(req, res, next) {
  if (!isUuid(req.params.id)) return next(ApiError.badRequest("Invalid scan id"));
  next();
}

function validateScanQuery(req, res, next) {
  if (req.query.cropId && !isUuid(req.query.cropId)) {
    return next(ApiError.badRequest("Invalid cropId"));
  }
  next();
}

module.exports = { validateSubmitScan, validateScanIdParam, validateScanQuery };