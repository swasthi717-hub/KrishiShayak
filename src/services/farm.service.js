const farmRepository = require("../repositories/farm.repository");
const profileService = require("./profile.service");
const { ApiError } = require("../utils/errors");
const { FARM_FIELDS } = require("../validators/farm.validator");

function pickFields(payload = {}, fields) {
  const updates = {};
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      if (field === "farm_name" && typeof payload[field] === "string") {
        updates[field] = payload[field].trim();
      } else {
        updates[field] = payload[field] === "" ? null : payload[field];
      }
    }
  });
  return updates;
}

async function createFarm(user, payload) {
  await profileService.getOrCreateProfile(user);
  const fields = pickFields(payload, FARM_FIELDS);
  return farmRepository.insert({ ...fields, user_id: user.id });
}

async function listFarms(userId) {
  return farmRepository.findByUserId(userId);
}

async function getOwnedFarm(userId, farmId) {
  const farm = await farmRepository.findOwnedById(userId, farmId);
  if (!farm) throw ApiError.notFound("Farm not found");
  return farm;
}

async function updateFarm(userId, farmId, payload) {
  await getOwnedFarm(userId, farmId);
  const updates = pickFields(payload, FARM_FIELDS);
  if (!Object.keys(updates).length) throw ApiError.badRequest("No valid farm fields provided");
  const updated = await farmRepository.updateOwnedById(userId, farmId, updates);
  if (!updated) throw ApiError.notFound("Farm not found");
  return updated;
}

async function deleteFarm(userId, farmId) {
  await getOwnedFarm(userId, farmId);
  await farmRepository.deleteOwnedById(userId, farmId);
}

module.exports = { createFarm, listFarms, getOwnedFarm, updateFarm, deleteFarm };