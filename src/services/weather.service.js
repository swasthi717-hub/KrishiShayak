const weatherProvider = require("../integrations/weather.provider");
const weatherCacheRepository = require("../repositories/weatherCache.repository");
const farmService = require("./farm.service");
const cropService = require("./crop.service");
const alertService = require("./alert.service");
const logger = require("../utils/logger");
const { ApiError } = require("../utils/errors");

const CURRENT_TTL_MS = 30 * 60 * 1000; // 30 min
const FORECAST_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

// Rule-based agronomy heuristics (v1). Deliberately simple and swappable —
// not an ML model, just documented thresholds so it can be replaced later
// without touching the controller/route contract.
function deriveRisksAndRecommendations({ current, forecast }, crops = []) {
  const risks = [];
  const recommendations = [];

  const rainNext24h = (forecast?.list || [])
    .slice(0, 8) // ~24h of 3-hour steps
    .reduce((sum, step) => sum + (step.rain?.["3h"] || 0), 0);

  const maxTempNext7Days = (forecast?.list || []).reduce(
    (max, step) => Math.max(max, step.main?.temp_max ?? -Infinity),
    current?.main?.temp_max ?? -Infinity
  );

  const humidity = current?.main?.humidity ?? null;

  if (rainNext24h >= 40) {
    risks.push({ type: "heavy_rain", level: "high", detail: `${rainNext24h.toFixed(0)}mm expected in the next 24h` });
    recommendations.push("Heavy rain expected — skip irrigation and ensure field drainage is clear.");
  } else if (rainNext24h > 0) {
    risks.push({ type: "rain", level: "info", detail: `${rainNext24h.toFixed(0)}mm expected in the next 24h` });
    recommendations.push("Rain expected — consider delaying irrigation and fertilizer application.");
  }

  if (maxTempNext7Days >= 40) {
    risks.push({ type: "heatwave", level: "high", detail: `Temperatures up to ${maxTempNext7Days.toFixed(0)}°C forecast` });
    recommendations.push("Heatwave risk — increase irrigation frequency, especially for shallow-rooted crops.");
  }

  if (humidity !== null && humidity >= 80) {
    const pestProneCrops = crops.filter((c) =>
      ["cotton", "tomato"].includes((c.crop_name || "").toLowerCase())
    );
    if (pestProneCrops.length) {
      risks.push({ type: "pest_risk", level: "medium", detail: `High humidity (${humidity}%) favors pest/fungal outbreaks` });
      recommendations.push(
        `High humidity — inspect ${pestProneCrops.map((c) => c.crop_name).join(", ")} for pest or fungal signs.`
      );
    }
  }

  if (!risks.length) {
    recommendations.push("No significant weather risks detected for your farm right now.");
  }

  return { risks, recommendations };
}

async function getWeatherForFarm(userId, farmId) {
  const farm = await farmService.getOwnedFarm(userId, farmId);

  if (farm.latitude == null || farm.longitude == null) {
    throw ApiError.badRequest("This farm has no latitude/longitude set — add coordinates to fetch weather");
  }

  let currentCache = await weatherCacheRepository.findFresh(farmId, "current", CURRENT_TTL_MS);
  if (!currentCache) {
    const current = await weatherProvider.getCurrentWeather(farm.latitude, farm.longitude);
    currentCache = await weatherCacheRepository.upsert({
      farmId,
      latitude: farm.latitude,
      longitude: farm.longitude,
      forecastType: "current",
      payload: current,
    });
  }

  let forecastCache = await weatherCacheRepository.findFresh(farmId, "forecast", FORECAST_TTL_MS);
  if (!forecastCache) {
    const forecast = await weatherProvider.getForecast(farm.latitude, farm.longitude);
    forecastCache = await weatherCacheRepository.upsert({
      farmId,
      latitude: farm.latitude,
      longitude: farm.longitude,
      forecastType: "forecast",
      payload: forecast,
    });
  }

  const crops = await cropService.listCrops(userId, farmId);
  const { risks, recommendations } = deriveRisksAndRecommendations(
    { current: currentCache.payload, forecast: forecastCache.payload },
    crops
  );

  // Best-effort: turn high-severity risks into Smart Alerts. Never lets an
  // alert-pipeline failure break the weather response itself.
  const highRisks = risks.filter((r) => r.level === "high");
  await Promise.all(
    highRisks.map((risk) =>
      alertService
        .createAndSend(userId, {
          category: "weather",
          title: risk.type === "heavy_rain" ? "Heavy Rain Alert" : "Heatwave Alert",
          body: risk.detail,
          severity: "urgent",
          data: { farmId, riskType: risk.type },
          dedupeSeed: `weather:${farmId}:${risk.type}:${new Date().toISOString().slice(0, 10)}`,
        })
        .catch((error) => logger.warn("Failed to raise weather alert", error.message))
    )
  );

  return {
    current: currentCache.payload,
    forecast: forecastCache.payload,
    risks,
    recommendations,
    cachedAt: {
      current: currentCache.fetched_at,
      forecast: forecastCache.fetched_at,
    },
  };
}

module.exports = { getWeatherForFarm, deriveRisksAndRecommendations };