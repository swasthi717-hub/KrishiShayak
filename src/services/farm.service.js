const { supabaseAdmin } = require("../config/db");
const { ApiError } = require("../utils/errors");
const profileService = require("./profile.service");
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

function throwIfDbError(error, fallbackMessage) {
  if (!error) {
    return;
  }
  throw new ApiError(500, `${fallbackMessage}: ${error.message}`);
}

async function createFarm(user, payload) {
  await profileService.getOrCreateProfile(user);

  const fields = pickFields(payload, FARM_FIELDS);
  const { data, error } = await supabaseAdmin
    .from("farms")
    .insert({
      ...fields,
      user_id: user.id,
    })
    .select("*")
    .single();

  throwIfDbError(error, "Failed to create farm");
  return data;
}

async function listFarms(userId) {
  const { data, error } = await supabaseAdmin
    .from("farms")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  throwIfDbError(error, "Failed to list farms");
  return data || [];
}

async function getOwnedFarm(userId, farmId) {
  const { data, error } = await supabaseAdmin
    .from("farms")
    .select("*")
    .eq("id", farmId)
    .eq("user_id", userId)
    .maybeSingle();

  throwIfDbError(error, "Failed to load farm");

  if (!data) {
    throw ApiError.notFound("Farm not found");
  }

  return data;
}

async function updateFarm(userId, farmId, payload) {
  await getOwnedFarm(userId, farmId);

  const updates = pickFields(payload, FARM_FIELDS);
  if (!Object.keys(updates).length) {
    throw ApiError.badRequest("No valid farm fields provided");
  }

  const { data, error } = await supabaseAdmin
    .from("farms")
    .update(updates)
    .eq("id", farmId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  throwIfDbError(error, "Failed to update farm");

  if (!data) {
    throw ApiError.notFound("Farm not found");
  }

  return data;
}

async function deleteFarm(userId, farmId) {
  await getOwnedFarm(userId, farmId);

  const { error } = await supabaseAdmin.from("farms").delete().eq("id", farmId).eq("user_id", userId);

  throwIfDbError(error, "Failed to delete farm");
}

module.exports = {
  createFarm,
  listFarms,
  getOwnedFarm,
  updateFarm,
  deleteFarm,
};
