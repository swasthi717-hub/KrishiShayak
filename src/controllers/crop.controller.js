const { success } = require("../../../../src/utils/apiResponse");
const asyncHandler = require("../../../../src/utils/asyncHandler");
const cropService = require("../../../../src/services/crop.service");

const createCrop = asyncHandler(async (req, res) => {
  const crop = await cropService.createCrop(req.user.id, req.body);
  return success(res, {
    statusCode: 201,
    message: "Crop created",
    data: crop,
  });
});

const listCrops = asyncHandler(async (req, res) => {
  const crops = await cropService.listCrops(req.user.id, req.query.farmId);
  return success(res, {
    message: "Crops retrieved",
    data: crops,
  });
});

const getCrop = asyncHandler(async (req, res) => {
  const crop = await cropService.getOwnedCrop(req.user.id, req.params.id);
  return success(res, {
    message: "Crop retrieved",
    data: crop,
  });
});

const updateCrop = asyncHandler(async (req, res) => {
  const crop = await cropService.updateCrop(req.user.id, req.params.id, req.body);
  return success(res, {
    message: "Crop updated",
    data: crop,
  });
});

const deleteCrop = asyncHandler(async (req, res) => {
  await cropService.deleteCrop(req.user.id, req.params.id);
  return success(res, {
    message: "Crop deleted",
    data: null,
  });
});

module.exports = {
  createCrop,
  listCrops,
  getCrop,
  updateCrop,
  deleteCrop,
};
