const axios = require("axios");
const env = require("../config/env");
const { ApiError } = require("../utils/errors");

function assertConfigured() {
  if (!env.weatherApiKey) {
    throw new ApiError(503, "Weather service is not configured. Set WEATHER_API_KEY to enable it.");
  }
}

async function getCurrentWeather(latitude, longitude) {
  assertConfigured();
  try {
    const { data } = await axios.get(`${env.weatherApiBaseUrl}/weather`, {
      params: { lat: latitude, lon: longitude, appid: env.weatherApiKey, units: "metric" },
      timeout: 8000,
    });
    return data;
  } catch (error) {
    throw new ApiError(502, `Weather provider request failed: ${error.message}`);
  }
}

async function getForecast(latitude, longitude) {
  assertConfigured();
  try {
    // OpenWeatherMap free "forecast" endpoint returns 3-hour steps for 5 days.
    const { data } = await axios.get(`${env.weatherApiBaseUrl}/forecast`, {
      params: { lat: latitude, lon: longitude, appid: env.weatherApiKey, units: "metric" },
      timeout: 8000,
    });
    return data;
  } catch (error) {
    throw new ApiError(502, `Weather provider request failed: ${error.message}`);
  }
}

module.exports = { getCurrentWeather, getForecast };