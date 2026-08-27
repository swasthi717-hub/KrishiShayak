const { success } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const diseaseDetectionService = require("../services/diseaseDetection.service");

const submitScan = asyncHandler(async (req, res) => {
  const result = await diseaseDetectionService.submitScan(req.user.id, req.body, req.file);
  return success(res, { statusCode: 201, message: "Scan submitted", data: result });
});

const getScan = asyncHandler(async (req, res) => {
  const result = await diseaseDetectionService.getScan(req.user.id, req.params.id);
  return success(res, { message: "Scan retrieved", data: result });
});

const listScans = asyncHandler(async (req, res) => {
  const result = await diseaseDetectionService.listScans(req.user.id, req.query.cropId);
  return success(res, { message: "Scans retrieved", data: result });
});

module.exports = { submitScan, getScan, listScans };