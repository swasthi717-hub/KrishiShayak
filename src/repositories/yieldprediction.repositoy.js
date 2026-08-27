const { supabaseAdmin } = require("../config/db");
const { ApiError } = require("../utils/errors");

async function insert(record) {
  const { data, error } = await supabaseAdmin.from("yield_predictions").insert(record).select("*").single();
  if (error) throw new ApiError(500, `Failed to create yield prediction: ${error.message}`);
  return data;
}

async function updateById(id, updates) {
  const { data, error } = await supabaseAdmin
    .from("yield_predictions")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new ApiError(500, `Failed to update yield prediction: ${error.message}`);
  return data;
}

async function findOwnedById(userId, id) {
  const { data, error } = await supabaseAdmin
    .from("yield_predictions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new ApiError(500, `Failed to load yield prediction: ${error.message}`);
  return data;
}

async function findByUserId(userId, { farmId, cropId, simulation }) {
  let query = supabaseAdmin
    .from("yield_predictions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (farmId) query = query.eq("farm_id", farmId);
  if (cropId) query = query.eq("crop_id", cropId);
  if (simulation !== undefined) query = query.eq("simulation", simulation);

  const { data, error } = await query;
  if (error) throw new ApiError(500, `Failed to list yield predictions: ${error.message}`);
  return data || [];
}

module.exports = { insert, updateById, findOwnedById, findByUserId };