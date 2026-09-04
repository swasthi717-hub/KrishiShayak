const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast";

export async function getWeather(latitude, longitude) {
  try {
    const url = new URL(OPEN_METEO_URL);

    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);

    url.searchParams.set(
      "current",
      [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation",
        "weather_code",
        "wind_speed_10m",
      ].join(",")
    );

    url.searchParams.set(
      "hourly",
      [
        "temperature_2m",
        "precipitation_probability",
        "precipitation",
        "weather_code",
      ].join(",")
    );

    url.searchParams.set(
      "daily",
      [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "precipitation_sum",
      ].join(",")
    );

    url.searchParams.set("timezone", "auto");

    url.searchParams.set("forecast_days", "7");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Weather API error: ${response.status}`
      );
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(
      "Failed to fetch weather:",
      error
    );

    throw error;
  }
}