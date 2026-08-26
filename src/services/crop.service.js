const { supabaseAdmin } = require("../config/db");
const { ApiError } = require("../utils/errors");
const farmService = require("./farm.service");
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

function throwIfDbError(error, fallbackMessage) {
  if (!error) {
    return;
  }
  throw new ApiError(500, `${fallbackMessage}: ${error.message}`);
}

async function assertFarmOwned(userId, farmId) {
  return farmService.getOwnedFarm(userId, farmId);
}

async function getOwnedCrop(userId, cropId) {
  const { data, error } = await supabaseAdmin.from("crops").select("*").eq("id", cropId).maybeSingle();

  throwIfDbError(error, "Failed to load crop");

  if (!data) {
    throw ApiError.notFound("Crop not found");
  }

  await assertFarmOwned(userId, data.farm_id);
  return data;
}

async function createCrop(userId, payload) {
  const fields = pickFields(payload, CROP_FIELDS);
  await assertFarmOwned(userId, fields.farm_id);

  const { data, error } = await supabaseAdmin.from("crops").insert(fields).select("*").single();

  throwIfDbError(error, "Failed to create crop");
  return data;
}

async function listCrops(userId, farmId) {
  if (farmId) {
    await assertFarmOwned(userId, farmId);

    const { data, error } = await supabaseAdmin
      .from("crops")
      .select("*")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false });

    throwIfDbError(error, "Failed to list crops");
    return data || [];
  }

  const farms = await farmService.listFarms(userId);
  const farmIds = farms.map((farm) => farm.id);

  if (!farmIds.length) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("crops")
    .select("*")
    .in("farm_id", farmIds)
    .order("created_at", { ascending: false });

  throwIfDbError(error, "Failed to list crops");
  return data || [];
}

async function updateCrop(userId, cropId, payload) {
  const existing = await getOwnedCrop(userId, cropId);
  const updates = pickFields(payload, CROP_FIELDS);

  if (!Object.keys(updates).length) {
    throw ApiError.badRequest("No valid crop fields provided");
  }

  if (updates.farm_id && updates.farm_id !== existing.farm_id) {
    await assertFarmOwned(userId, updates.farm_id);
  }

  const { data, error } = await supabaseAdmin
    .from("crops")
    .update(updates)
    .eq("id", cropId)
    .select("*")
    .maybeSingle();

  throwIfDbError(error, "Failed to update crop");

  if (!data) {
    throw ApiError.notFound("Crop not found");
  }

  return data;
}

async function deleteCrop(userId, cropId) {
  await getOwnedCrop(userId, cropId);

  const { error } = await supabaseAdmin.from("crops").delete().eq("id", cropId);

  throwIfDbError(error, "Failed to delete crop");
}

module.exports = {
  createCrop,
  listCrops,
  getOwnedCrop,
  updateCrop,
  deleteCrop,
};
