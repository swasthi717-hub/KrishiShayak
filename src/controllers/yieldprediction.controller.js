const { success } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const yieldPredictionService = require("../services/yieldPrediction.service");

const predict = asyncHandler(async (req, res) => {
  const result = await yieldPredictionService.predict(req.user.id, { ...req.body, simulation: false });
  return success(res, { statusCode: 201, message: "Yield prediction generated", data: result });
});

const listPredictions = asyncHandler(async (req, res) => {
  const result = await yieldPredictionService.listPredictions(req.user.id, req.query);
  return success(res, { message: "Yield predictions retrieved", data: result });
});

const getPrediction = asyncHandler(async (req, res) => {
  const result = await yieldPredictionService.getPrediction(req.user.id, req.params.id);
  return success(res, { message: "Yield prediction retrieved", data: result });
});

module.exports = { predict, listPredictions, getPrediction };