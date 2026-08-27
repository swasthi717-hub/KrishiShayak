const yieldModelProvider = require("../integrations/yieldModel.provider");
const yieldPredictionRepository = require("../repositories/yieldPrediction.repository");
const farmService = require("./farm.service");
const cropService = require("./crop.service");
const soilReportService = require("./soilReport.service");
const fertilizerRecommendationRepository = require("../repositories/fertilizerRecommendation.repository");
const diseaseDetectionRepository = require("../repositories/diseaseDetection.repository");
const weatherCacheRepository = require("../repositories/weatherCache.repository");
const { ApiError } = require("../utils/errors");

async function buildInputSnapshot(userId, { farmId, cropId, overrides = {} }) {
  const farm = await farmService.getOwnedFarm(userId, farmId);
  const crop = await cropService.getOwnedCrop(userId, cropId);

  if (crop.farm_id !== farm.id) {
    throw ApiError.badRequest("crop does not belong to the given farm");
  }

  const soilReport = await soilReportService.getLatestForFarm(userId, farmId);
  const fertilizerHistory = await fertilizerRecommendationRepository.findByCropId(cropId);
  const diseaseHistory = await diseaseDetectionRepository.findByUserId(userId, cropId);
  const weather = await weatherCacheRepository.findLatest(farmId, "forecast");

  const snapshot = {
    farm: {
      area: farm.area,
      area_unit: farm.area_unit,
      soil_type: farm.soil_type,
      irrigation_type: farm.irrigation_type,
    },
    crop: {
      crop_name: crop.crop_name,
      variety: crop.variety,
      sowing_date: crop.sowing_date,
      expected_harvest_date: crop.expected_harvest_date,
      growth_stage: crop.growth_stage,
      acreage: crop.acreage,
      previous_yield: crop.previous_yield,
    },
    soil: soilReport
      ? {
          nitrogen: soilReport.nitrogen,
          phosphorus: soilReport.phosphorus,
          potassium: soilReport.potassium,
          ph: soilReport.ph,
          organic_carbon: soilReport.organic_carbon,
        }
      : null,
    fertilizer_applications: fertilizerHistory.length,
    disease_incidents: diseaseHistory.filter((d) => d.status === "completed").length,
    weather_forecast_available: Boolean(weather),
    overrides,
  };

  return snapshot;
}

async function predict(userId, { farmId, cropId, overrides, simulation = false }) {
  const snapshot = await buildInputSnapshot(userId, { farmId, cropId, overrides });

  let record = await yieldPredictionRepository.insert({
    user_id: userId,
    farm_id: farmId,
    crop_id: cropId,
    input_snapshot: snapshot,
    simulation,
    status: "pending",
  });

  try {
    const result = await yieldModelProvider.predict(snapshot);
    record = await yieldPredictionRepository.updateById(record.id, {
      status: "completed",
      predicted_yield: result.predicted_yield,
      predicted_yield_unit: result.predicted_yield_unit || "quintal",
      estimated_profit: result.estimated_profit ?? null,
      confidence: result.confidence ?? null,
      model_version: result.model_version || null,
    });
    return record;
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Yield prediction failed";
    await yieldPredictionRepository.updateById(record.id, { status: "failed", error_message: message });
    throw error instanceof ApiError ? error : new ApiError(500, message);
  }
}

async function listPredictions(userId, { farmId, cropId, simulation }) {
  const parsedSimulation = simulation === undefined ? undefined : simulation === "true";
  return yieldPredictionRepository.findByUserId(userId, { farmId, cropId, simulation: parsedSimulation });
}

async function getPrediction(userId, id) {
  const record = await yieldPredictionRepository.findOwnedById(userId, id);
  if (!record) throw ApiError.notFound("Yield prediction not found");
  return record;
}

module.exports = { buildInputSnapshot, predict, listPredictions, getPrediction };