const { success } = require("../../../../src/utils/apiResponse");
const asyncHandler = require("../../../../src/utils/asyncHandler");
const farmService = require("../../../../src/services/farm.service");

const createFarm = asyncHandler(async (req, res) => {
  const farm = await farmService.createFarm(req.user, req.body);
  return success(res, {
    statusCode: 201,
    message: "Farm created",
    data: farm,
  });
});

const listFarms = asyncHandler(async (req, res) => {
  const farms = await farmService.listFarms(req.user.id);
  return success(res, {
    message: "Farms retrieved",
    data: farms,
  });
});

const getFarm = asyncHandler(async (req, res) => {
  const farm = await farmService.getOwnedFarm(req.user.id, req.params.id);
  return success(res, {
    message: "Farm retrieved",
    data: farm,
  });
});

const updateFarm = asyncHandler(async (req, res) => {
  const farm = await farmService.updateFarm(req.user.id, req.params.id, req.body);
  return success(res, {
    message: "Farm updated",
    data: farm,
  });
});

const deleteFarm = asyncHandler(async (req, res) => {
  await farmService.deleteFarm(req.user.id, req.params.id);
  return success(res, {
    message: "Farm deleted",
    data: null,
  });
});

module.exports = {
  createFarm,
  listFarms,
  getFarm,
  updateFarm,
  deleteFarm,
};
