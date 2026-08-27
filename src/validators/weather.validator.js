const { ApiError } = require("../utils/errors");
const { isUuid } = require("./farm.validator");

function validateFarmIdParam(req, res, next) {
  if (!isUuid(req.params.farmId)) return next(ApiError.badRequest("Invalid farmId"));
  next();
}

module.exports = { validateFarmIdParam };