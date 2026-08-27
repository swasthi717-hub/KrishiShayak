const { supabaseAdmin } = require("../config/db");
const { ApiError } = require("../utils/errors");

async function findFresh(farmId, forecastType, maxAgeMs) {
  const { data, error } = await supabaseAdmin
    .from("weather_cache")
    .select("*")
    .eq("farm_id", farmId)
    .eq("forecast_type", forecastType)
    .maybeSingle();

  if (error) throw new ApiError(500, `Failed to read weather cache: ${error.message}`);
  if (!data) return null;

  const age = Date.now() - new Date(data.fetched_at).getTime();
  if (age > maxAgeMs) return null;
  return data;
}

async function upsert({ farmId, latitude, longitude, forecastType, payload }) {
  const { data, error } = await supabaseAdmin
    .from("weather_cache")
    .upsert(
      {
        farm_id: farmId,
        latitude,
        longitude,
        forecast_type: forecastType,
        payload,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "farm_id,forecast_type" }
    )
    .select("*")
    .single();

  if (error) throw new ApiError(500, `Failed to cache weather data: ${error.message}`);
  return data;
}

async function findLatest(farmId, forecastType) {
  const { data, error } = await supabaseAdmin
    .from("weather_cache")
    .select("*")
    .eq("farm_id", farmId)
    .eq("forecast_type", forecastType)
    .maybeSingle();
  if (error) throw new ApiError(500, `Failed to read weather cache: ${error.message}`);
  return data;
}

module.exports = { findFresh, findLatest, upsert };