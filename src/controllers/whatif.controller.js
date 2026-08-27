const { success } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const yieldPredictionService = require("../services/yieldPrediction.service");

// The what-if simulator is intentionally a thin wrapper around the same
// yield-prediction service/model used for real predictions — it never
// computes yield/profit itself. See yieldPrediction.service.js.
const simulate = asyncHandler(async (req, res) => {
  const { farmId, cropId, overrides } = req.body;
  const result = await yieldPredictionService.predict(req.user.id, {
    farmId,
    cropId,
    overrides,
    simulation: true,
  });
  return success(res, { statusCode: 201, message: "Simulation generated", data: result });
});

module.exports = { simulate };