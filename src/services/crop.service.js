const cropRepository = require("../repositories/crop.repository");
const farmService = require("./farm.service");
const { ApiError } = require("../utils/errors");
const { CROP_FIELDS } = require("../validators/crop.validator");

function pickFields(payload = {}, fields) {
  const updates = {};
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      if (field === "crop_name" && typeof payload[field] === "string") {
        updates[field] = payload[field].trim();
      } else {
        updates[field] = payload[field] === "" ? null : payload[field];
      }
    }
  });
  return updates;
}

async function assertFarmOwned(userId, farmId) {
  return farmService.getOwnedFarm(userId, farmId);
}

async function getOwnedCrop(userId, cropId) {
  const crop = await cropRepository.findById(cropId);
  if (!crop) throw ApiError.notFound("Crop not found");
  await assertFarmOwned(userId, crop.farm_id);
  return crop;
}

async function createCrop(userId, payload) {
  const fields = pickFields(payload, CROP_FIELDS);
  await assertFarmOwned(userId, fields.farm_id);
  return cropRepository.insert(fields);
}

async function listCrops(userId, farmId) {
  if (farmId) {
    await assertFarmOwned(userId, farmId);
    return cropRepository.findByFarmId(farmId);
  }
  const farms = await farmService.listFarms(userId);
  const farmIds = farms.map((farm) => farm.id);
  return cropRepository.findByFarmIds(farmIds);
}

async function updateCrop(userId, cropId, payload) {
  const existing = await getOwnedCrop(userId, cropId);
  const updates = pickFields(payload, CROP_FIELDS);
  if (!Object.keys(updates).length) throw ApiError.badRequest("No valid crop fields provided");
  if (updates.farm_id && updates.farm_id !== existing.farm_id) {
    await assertFarmOwned(userId, updates.farm_id);
  }
  const updated = await cropRepository.updateById(cropId, updates);
  if (!updated) throw ApiError.notFound("Crop not found");
  return updated;
}

async function deleteCrop(userId, cropId) {
  await getOwnedCrop(userId, cropId);
  await cropRepository.deleteById(cropId);
}

module.exports = { createCrop, listCrops, getOwnedCrop, updateCrop, deleteCrop };