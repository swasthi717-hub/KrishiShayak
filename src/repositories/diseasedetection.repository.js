const { supabaseAdmin } = require("../config/db");
const { ApiError } = require("../utils/errors");

async function insert(record) {
  const { data, error } = await supabaseAdmin.from("disease_detections").insert(record).select("*").single();
  if (error) throw new ApiError(500, `Failed to create disease detection: ${error.message}`);
  return data;
}

async function updateById(id, updates) {
  const { data, error } = await supabaseAdmin
    .from("disease_detections")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new ApiError(500, `Failed to update disease detection: ${error.message}`);
  return data;
}

async function findOwnedById(userId, id) {
  const { data, error } = await supabaseAdmin
    .from("disease_detections")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new ApiError(500, `Failed to load disease detection: ${error.message}`);
  return data;
}

async function findByUserId(userId, cropId) {
  let query = supabaseAdmin
    .from("disease_detections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (cropId) query = query.eq("crop_id", cropId);

  const { data, error } = await query;
  if (error) throw new ApiError(500, `Failed to list disease detections: ${error.message}`);
  return data || [];
}

module.exports = { insert, updateById, findOwnedById, findByUserId };