const { supabaseAdmin } = require("../config/db");
const { ApiError } = require("../utils/errors");

async function findByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, `Failed to load profile: ${error.message}`);
  }

  return data;
}

async function insert(profile) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert(profile)
    .select("*")
    .single();

  if (error) {
    throw new ApiError(500, `Failed to create profile: ${error.message}`);
  }

  return data;
}

async function updateByUserId(userId, updates) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new ApiError(500, `Failed to update profile: ${error.message}`);
  }

  return data;
}

module.exports = {
  findByUserId,
  insert,
  updateByUserId,
};
