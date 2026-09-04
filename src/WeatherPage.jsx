import React, { useEffect, useState } from "react";

import { getWeather } from "./services/weatherApi.js";
import { getCoordinatesFromLocation } from "./services/geocodingApi.js";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";

import {
  Sun,
  CloudRain,
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  Bug,
  Snowflake,
  TrendingUp,
  TrendingDown,
  Sprout,
  CheckCircle2,
  Zap,
  Eye,
  Cloud,
} from "lucide-react";

import Layout from "./Layout.jsx";

/* ---------------- WEATHER HELPERS ---------------- */

function getWeatherInfo(code) {
  if (code === 0) {
    return {
      text: "Clear Sky",
      icon: Sun,
    };
  }

  if (code === 1 || code === 2) {
    return {
      text: "Partly Cloudy",
      icon: CloudSun,
    };
  }

  if (code === 3) {
    return {
      text: "Overcast",
      icon: Cloud,
    };
  }

  if (
    code === 51 ||
    code === 53 ||
    code === 55 ||
    code === 56 ||
    code === 57
  ) {
    return {
      text: "Drizzle",
      icon: CloudRain,
    };
  }

  if (
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 66 ||
    code === 67
  ) {
    return {
      text: "Rain",
      icon: CloudRain,
    };
  }

  if (code === 71 || code === 73 || code === 75 || code === 77) {
    return {
      text: "Snow",
      icon: Snowflake,
    };
  }

  if (code === 80 || code === 81 || code === 82) {
    return {
      text: "Rain Showers",
      icon: CloudRain,
    };
  }

  if (code === 85 || code === 86) {
    return {
      text: "Snow Showers",
      icon: Snowflake,
    };
  }

  if (code === 95 || code === 96 || code === 99) {
    return {
      text: "Thunderstorm",
      icon: CloudRain,
    };
  }

  return {
    text: "Unknown",
    icon: Cloud,
  };
}

/* ---------------- RISK ALERTS ---------------- */

const riskAlerts = [
  {
    title: "Heavy Rain",
    text: "Heavy rainfall may increase waterlogging risk. Check field drainage.",
    label: "Weather Risk",
    icon: CloudRain,
    box: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-500",
    badge: "bg-blue-100 text-blue-600",
  },
  {
    title: "Heatwave",
    text: "High temperatures can increase crop water stress. Monitor irrigation.",
    label: "Monitor",
    icon: Thermometer,
    box: "bg-red-50 border-red-200",
    iconColor: "text-red-500",
    badge: "bg-orange-100 text-orange-600",
  },
  {
    title: "Frost Risk",
    text: "Low temperatures can damage sensitive crops. Monitor overnight conditions.",
    label: "Monitor",
    icon: Snowflake,
    box: "bg-sky-50 border-sky-200",
    iconColor: "text-sky-500",
    badge: "bg-green-100 text-green-700",
  },
  {
    title: "Pest Risk",
    text: "Warm and humid conditions can increase pest pressure. Inspect crops regularly.",
    label: "Monitor",
    icon: Bug,
    box: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-500",
    badge: "bg-orange-100 text-orange-600",
  },
];

/* ---------------- ACTION PLAN ---------------- */

const actionPlan = [
  "Check field drainage before heavy rainfall",
  "Avoid unnecessary irrigation when rain is expected",
  "Inspect crops for pest or disease symptoms",
  "Harvest ripe produce before heavy rain",
  "Monitor soil moisture after rainfall",
  "Store harvested produce in a dry, shaded place",
];

/* ---------------- CROP HELPERS ---------------- */

/*
 * Returns an emoji based on the crop entered during onboarding.
 * Unknown crops get a generic plant emoji.
 */
function getCropEmoji(cropName) {
  const name = cropName.toLowerCase();

  if (name.includes("cotton")) return "🌾";
  if (name.includes("tomato")) return "🍅";
  if (name.includes("wheat")) return "🌽";
  if (name.includes("onion")) return "🧅";
  if (name.includes("rice")) return "🌾";
  if (name.includes("potato")) return "🥔";
  if (name.includes("maize") || name.includes("corn")) return "🌽";
  if (name.includes("sugarcane")) return "🎋";
  if (name.includes("groundnut")) return "🥜";
  if (name.includes("soybean")) return "🌱";
  if (name.includes("mustard")) return "🌼";

  return "🌱";
}

/*
 * Returns crop-specific weather advice.
 *
 * Cotton, Tomato, Wheat and Onion have specific advice.
 * Any other crop entered during onboarding gets general
 * weather-based farming advice.
 */
function getCropAdvice(cropName) {
  const name = cropName.toLowerCase();

  /* ---------------- COTTON ---------------- */

  if (name.includes("cotton")) {
    return {
      status: "Monitor",
      statusClass: "bg-orange-100 text-orange-700",
      bg: "bg-orange-50/70",
      border: "border-orange-200",

      items: [
        {
          icon: CloudRain,
          title: "Rain Impact",
          text: "Heavy rainfall can cause waterlogging. Keep drainage channels clear.",
          color: "text-blue-500",
        },
        {
          icon: Bug,
          title: "Pest Monitoring",
          text: "Warm and humid conditions may increase pest pressure. Inspect regularly.",
          color: "text-red-500",
        },
        {
          icon: Sun,
          title: "Sunny Conditions",
          text: "Dry and sunny periods are useful for field operations.",
          color: "text-yellow-500",
        },
      ],

      action:
        "Keep drainage clear and monitor the crop after rainfall.",
    };
  }

  /* ---------------- TOMATO ---------------- */

  if (name.includes("tomato")) {
    return {
      status: "Monitor",
      statusClass: "bg-red-100 text-red-600",
      bg: "bg-red-50/70",
      border: "border-red-200",

      items: [
        {
          icon: CloudRain,
          title: "Rain + Humidity",
          text: "Wet conditions can increase fungal disease risk.",
          color: "text-blue-500",
        },
        {
          icon: Thermometer,
          title: "Temperature",
          text: "High temperatures may cause heat stress. Monitor plants closely.",
          color: "text-red-500",
        },
        {
          icon: TrendingUp,
          title: "Harvest Timing",
          text: "Harvest ripe fruit before periods of heavy rainfall.",
          color: "text-green-600",
        },
      ],

      action:
        "Monitor disease symptoms and harvest ripe fruit before heavy rain.",
    };
  }

  /* ---------------- WHEAT ---------------- */

  if (name.includes("wheat")) {
    return {
      status: "All Good",
      statusClass: "bg-green-100 text-green-700",
      bg: "bg-green-50/70",
      border: "border-green-200",

      items: [
        {
          icon: CloudRain,
          title: "Rain",
          text: "Rainfall may provide useful moisture depending on the crop stage.",
          color: "text-blue-500",
        },
        {
          icon: Thermometer,
          title: "Temperature",
          text: "Monitor high temperatures during sensitive growth stages.",
          color: "text-orange-500",
        },
        {
          icon: Droplets,
          title: "Irrigation",
          text: "Adjust irrigation according to rainfall and soil moisture.",
          color: "text-green-600",
        },
      ],

      action:
        "Monitor soil moisture and adjust irrigation based on rainfall.",
    };
  }

  /* ---------------- ONION ---------------- */

  if (name.includes("onion")) {
    return {
      status: "Monitor",
      statusClass: "bg-yellow-100 text-yellow-700",
      bg: "bg-yellow-50/70",
      border: "border-yellow-200",

      items: [
        {
          icon: CloudRain,
          title: "Rain Risk",
          text: "Excess moisture can increase bulb rot risk. Ensure good drainage.",
          color: "text-blue-500",
        },
        {
          icon: Eye,
          title: "Disease Monitoring",
          text: "High humidity can favor fungal diseases. Inspect leaves regularly.",
          color: "text-orange-500",
        },
        {
          icon: TrendingDown,
          title: "Market",
          text: "Check local market prices before deciding when to sell stored produce.",
          color: "text-red-500",
        },
      ],

      action:
        "Improve drainage and monitor for fungal disease after rainfall.",
    };
  }

  /* ---------------- DEFAULT CROP ADVICE ---------------- */

  return {
    status: "Monitor",
    statusClass: "bg-orange-100 text-orange-700",
    bg: "bg-orange-50/70",
    border: "border-orange-200",

    items: [
      {
        icon: CloudRain,
        title: "Rain Impact",
        text: "Monitor your crop after heavy rainfall and check field drainage.",
        color: "text-blue-500",
      },
      {
        icon: Thermometer,
        title: "Temperature",
        text: "Monitor temperature changes and protect the crop from heat or cold stress.",
        color: "text-red-500",
      },
      {
        icon: Droplets,
        title: "Irrigation",
        text: "Adjust irrigation according to rainfall and soil moisture.",
        color: "text-green-600",
      },
    ],

    action:
      "Monitor soil moisture, rainfall and crop health according to current weather.",
  };
}

/* ---------------- WEATHER PAGE ---------------- */

export default function WeatherPage() {
  const { user } = useAuth();

  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  const [locationName, setLocationName] = useState(null);

  /* User's actual crops from onboarding */
  const [userCrops, setUserCrops] = useState([]);
  const [cropsLoading, setCropsLoading] = useState(true);

  const current = weatherData?.current;
  const daily = weatherData?.daily;
  const hourlyData = weatherData?.hourly;

  /* ---------------- LOAD WEATHER + CROPS ---------------- */

  useEffect(() => {
    async function loadWeather() {
      try {
        setWeatherLoading(true);
        setCropsLoading(true);
        setWeatherError(null);

        if (!user) {
          throw new Error("You must be logged in.");
        }

        /* --------------------------------------------------
         * 1. Get state and district saved during onboarding
         * -------------------------------------------------- */

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("state, district")
            .eq("user_id", user.id)
            .single();

        if (profileError) {
          throw profileError;
        }

        const state = profile?.state?.trim();
        const district = profile?.district?.trim();

        if (!state || !district) {
          throw new Error(
            "Your state and district are not available. Please update your farm location."
          );
        }

        console.log("Farmer onboarding location:", {
          state,
          district,
        });

        /* --------------------------------------------------
         * 2. Get the farmer's farm
         * -------------------------------------------------- */

        const { data: farm, error: farmError } = await supabase
          .from("farms")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (farmError) {
          throw farmError;
        }

        /* --------------------------------------------------
         * 3. Get crops entered during onboarding
         * -------------------------------------------------- */

        if (farm?.id) {
          const { data: cropData, error: cropError } =
            await supabase
              .from("crops")
              .select("crop_name, acreage")
              .eq("farm_id", farm.id);

          if (cropError) {
            throw cropError;
          }

          console.log("Farmer onboarding crops:", cropData);

          setUserCrops(cropData || []);
        } else {
          console.log("No farm found for this user.");

          setUserCrops([]);
        }

        /* --------------------------------------------------
         * 4. Convert state + district into coordinates
         *
         * This is NOT live GPS.
         * It uses the location entered during onboarding.
         * -------------------------------------------------- */

        const location = await getCoordinatesFromLocation(
          state,
          district
        );

        console.log("Geocoded farmer location:", location);

        /* --------------------------------------------------
         * 5. Fetch weather for the onboarding location
         * -------------------------------------------------- */

        const data = await getWeather(
          location.latitude,
          location.longitude
        );

        console.log("Weather API data:", data);

        setWeatherData(data);

        /* --------------------------------------------------
         * 6. Display onboarding location
         * -------------------------------------------------- */

        setLocationName({
          city: district,
          state: state,
        });
      } catch (error) {
        console.error("Weather loading failed:", error);

        setWeatherError(
          error.message || "Unable to load weather data."
        );
      } finally {
        setWeatherLoading(false);
        setCropsLoading(false);
      }
    }

    if (user) {
      loadWeather();
    }
  }, [user]);

  /* ---------------- CURRENT WEATHER ---------------- */

  const currentWeatherInfo = current
    ? getWeatherInfo(current.weather_code)
    : {
        text: "--",
        icon: Cloud,
      };

  const CurrentWeatherIcon = currentWeatherInfo.icon;

  /* ---------------- DAILY FORECAST ---------------- */

  const forecast = daily
    ? daily.time.slice(0, 7).map((date, index) => {
        const weatherInfo = getWeatherInfo(
          daily.weather_code[index]
        );

        return {
          day:
            index === 0
              ? "Today"
              : new Date(date).toLocaleDateString("en-US", {
                  weekday: "short",
                }),

          icon: weatherInfo.icon,

          high: `${Math.round(
            daily.temperature_2m_max[index]
          )}°`,

          low: `${Math.round(
            daily.temperature_2m_min[index]
          )}°`,

          rain:
            daily.precipitation_probability_max[index] != null
              ? `${daily.precipitation_probability_max[index]}%`
              : null,

          active: index === 0,
        };
      })
    : [];

  /* ---------------- HOURLY FORECAST ---------------- */

  const hourly = hourlyData
    ? (() => {
        const now = new Date();
        const currentHour = now.getHours();

        const startIndex = hourlyData.time.findIndex((time) => {
          const hour = new Date(time).getHours();

          return hour >= currentHour;
        });

        const safeStartIndex =
          startIndex === -1 ? 0 : startIndex;

        return hourlyData.time
          .slice(safeStartIndex, safeStartIndex + 9)
          .map((time, index) => {
            const actualIndex = safeStartIndex + index;

            const weatherInfo = getWeatherInfo(
              hourlyData.weather_code[actualIndex]
            );

            return {
              time: new Date(time).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              }),

              temp: `${Math.round(
                hourlyData.temperature_2m[actualIndex]
              )}°`,

              rain:
                hourlyData.precipitation_probability[
                  actualIndex
                ] != null
                  ? `${hourlyData.precipitation_probability[actualIndex]}%`
                  : null,

              icon: weatherInfo.icon,
            };
          });
      })()
    : [];

  /* ---------------- DISPLAY CROPS ---------------- */

  /*
   * Convert the crops from Supabase into the format
   * required by the crop cards.
   */

  const displayCrops = userCrops.map((crop) => {
    const advice = getCropAdvice(crop.crop_name);

    return {
      name: crop.crop_name,

      acres:
        crop.acreage !== null &&
        crop.acreage !== undefined &&
        crop.acreage !== ""
          ? `${crop.acreage} Acres`
          : "Acreage not provided",

      emoji: getCropEmoji(crop.crop_name),

      ...advice,
    };
  });

  /* ---------------- LOADING STATE ---------------- */

  if (weatherLoading) {
    return (
      <Layout title="Weather">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#2d7054] border-t-transparent" />

            <p className="mt-4 font-semibold text-gray-600">
              Loading weather data...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  /* ---------------- ERROR STATE ---------------- */

  if (weatherError) {
    return (
      <Layout title="Weather">
        <div className="rounded-[24px] bg-red-50 p-6 text-center">
          <h2 className="font-serif text-xl font-bold text-red-700">
            Unable to load weather
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {weatherError}
          </p>

          <p className="mt-3 text-sm text-gray-500">
            Please check that your state and district are
            correctly saved in your profile and try again.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Weather">
      <div className="space-y-7">

        {/* ---------------- PAGE TITLE ---------------- */}

        <div>
          <h1 className="font-serif text-2xl font-bold text-[#202820]">
            Weather Intelligence
          </h1>

          {/* LOCATION */}

          {locationName && (
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-500">
              <MapPinIcon />

              <span>
                {locationName.city}
                {locationName.state &&
                  `, ${locationName.state}`}
              </span>
            </div>
          )}
        </div>

        {/* ---------------- CURRENT WEATHER + 7 DAY FORECAST ---------------- */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[395px_1fr]">

          {/* CURRENT WEATHER */}

          <div className="relative overflow-hidden rounded-[24px] bg-[#2d7054] p-7 text-white">

            <div className="absolute -right-8 -top-12 h-48 w-48 rounded-full bg-[#438064] opacity-70" />

            <p className="relative text-sm font-semibold text-white/70">
              Right Now
            </p>

            <div className="relative mt-3 flex items-center gap-5">

              <CurrentWeatherIcon
                size={55}
                strokeWidth={2.5}
                className="text-yellow-300"
              />

              <div>

                <div className="text-5xl font-bold">
                  {current
                    ? `${Math.round(
                        current.temperature_2m
                      )}°C`
                    : "--"}
                </div>

                <p className="text-sm text-white/70">
                  {currentWeatherInfo.text}
                </p>

              </div>

            </div>

            <div className="relative mt-7 grid grid-cols-2 gap-3">

              {/* HUMIDITY */}

              <div className="rounded-2xl bg-white/10 p-3">

                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Droplets size={16} />
                  Humidity
                </div>

                <p className="mt-1 text-lg font-bold">
                  {current
                    ? `${Math.round(
                        current.relative_humidity_2m
                      )}%`
                    : "--"}
                </p>

              </div>

              {/* WIND */}

              <div className="rounded-2xl bg-white/10 p-3">

                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Wind size={16} />
                  Wind
                </div>

                <p className="mt-1 text-lg font-bold">
                  {current
                    ? `${Math.round(
                        current.wind_speed_10m
                      )} km/h`
                    : "--"}
                </p>

              </div>

              {/* FEELS LIKE */}

              <div className="rounded-2xl bg-white/10 p-3">

                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Thermometer size={16} />
                  Feels Like
                </div>

                <p className="mt-1 text-lg font-bold">
                  {current
                    ? `${Math.round(
                        current.apparent_temperature
                      )}°C`
                    : "--"}
                </p>

              </div>

              {/* PRECIPITATION */}

              <div className="rounded-2xl bg-white/10 p-3">

                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Droplets size={16} />
                  Precipitation
                </div>

                <p className="mt-1 text-lg font-bold">
                  {current
                    ? `${current.precipitation ?? 0} mm`
                    : "--"}
                </p>

              </div>

            </div>
          </div>

          {/* ---------------- FORECAST ---------------- */}

          <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <h2 className="font-serif text-xl font-bold text-[#202820]">
              7-Day Forecast
            </h2>

            <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">

              {forecast.map((item) => {

                const Icon = item.icon;

                return (
                  <div
                    key={item.day}
                    className={`min-h-[155px] rounded-2xl p-3 text-center ${
                      item.active
                        ? "bg-[#2d7054] text-white"
                        : "bg-[#eae7df] text-[#202820]"
                    }`}
                  >

                    <p
                      className={`text-sm font-bold ${
                        item.active
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    >
                      {item.day}
                    </p>

                    <Icon
                      size={25}
                      className={`mx-auto my-4 ${
                        item.active
                          ? "text-yellow-300"
                          : item.icon === CloudRain
                          ? "text-blue-500"
                          : "text-yellow-500"
                      }`}
                    />

                    <p className="font-bold">
                      {item.high}
                    </p>

                    <p
                      className={`mt-1 text-sm ${
                        item.active
                          ? "text-white/60"
                          : "text-gray-500"
                      }`}
                    >
                      {item.low}
                    </p>

                    {item.rain && (
                      <p className="mt-3 text-sm font-semibold text-blue-500">
                        {item.rain}
                      </p>
                    )}

                  </div>
                );
              })}

            </div>

            {/* RAINFALL GRAPH */}

            <div className="mt-6">

              <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
                Rainfall Probability (%)
              </p>

              <div className="mt-4 flex h-20 items-end justify-between gap-4 px-5">

                {forecast.map((item, index) => {

                  const value =
                    daily?.precipitation_probability_max?.[
                      index
                    ] ?? 0;

                  return (
                    <div
                      key={item.day}
                      className="flex flex-1 items-end justify-center"
                    >
                      <div
                        className="w-7 rounded-t-md bg-blue-400"
                        style={{
                          height: `${Math.max(
                            value * 0.7,
                            4
                          )}px`,
                        }}
                      />
                    </div>
                  );
                })}

              </div>

              <div className="mt-1 flex justify-between px-5 text-[11px] text-gray-500">

                {forecast.map((item) => (
                  <span key={item.day}>
                    {item.day}
                  </span>
                ))}

              </div>

            </div>
          </div>
        </div>

        {/* ---------------- RISK ALERTS ---------------- */}

        <section>

          <h2 className="font-serif text-2xl font-bold text-[#202820]">
            Risk Alerts
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

            {riskAlerts.map((risk) => {

              const Icon = risk.icon;

              return (
                <div
                  key={risk.title}
                  className={`rounded-2xl border p-4 ${risk.box}`}
                >

                  <div className="flex items-center justify-between">

                    <Icon
                      size={23}
                      className={risk.iconColor}
                    />

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${risk.badge}`}
                    >
                      {risk.label}
                    </span>

                  </div>

                  <h3 className="mt-3 font-bold text-[#202820]">
                    {risk.title}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-gray-500">
                    {risk.text}
                  </p>

                </div>
              );
            })}

          </div>
        </section>

        {/* ---------------- ACTION PLAN ---------------- */}

        <section className="rounded-[24px] bg-[#d9f3dd] p-6">

          <div className="flex items-center gap-2">

            <Zap
              size={22}
              className="text-[#2d7054]"
            />

            <h2 className="font-serif text-xl font-bold text-[#2d7054]">
              Today's Action Plan
            </h2>

          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">

            {actionPlan.map((item, index) => {

              const completed = index === 3;

              return (
                <div
                  key={item}
                  className={`flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ${
                    completed ? "opacity-60" : ""
                  }`}
                >

                  <CheckCircle2
                    size={22}
                    className={
                      completed
                        ? "text-green-600"
                        : "text-gray-300"
                    }
                  />

                  <span
                    className={`text-sm font-semibold text-[#303830] ${
                      completed
                        ? "line-through text-gray-400"
                        : ""
                    }`}
                  >
                    {item}
                  </span>

                </div>
              );
            })}

          </div>

          <button className="mt-5 flex items-center gap-2 rounded-xl bg-[#2d7054] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#21563f]">

            <Sprout size={17} />

            Ask AI for More Farming Advice

          </button>

        </section>

        {/* ---------------- CROP IMPACT ---------------- */}

        <section>

          <h2 className="font-serif text-2xl font-bold text-[#202820]">
            How Today's Weather Affects Your Crops
          </h2>

          <p className="mt-1 text-sm text-gray-500">

            {current
              ? `Based on current conditions: ${
                  currentWeatherInfo.text
                } ${Math.round(
                  current.temperature_2m
                )}°C · Humidity ${Math.round(
                  current.relative_humidity_2m
                )}%`
              : "Based on current weather conditions"}

          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-4">

            {/* LOADING CROPS */}

            {cropsLoading ? (
              <div className="col-span-full rounded-2xl bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-semibold text-gray-500">
                  Loading your crops...
                </p>
              </div>
            ) : displayCrops.length === 0 ? (

              /* NO CROPS */

              <div className="col-span-full rounded-2xl bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-semibold text-gray-500">
                  No crops have been added yet.
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Add crops during onboarding to see weather
                  impact information here.
                </p>
              </div>

            ) : (

              /* USER'S ACTUAL CROPS */

              displayCrops.map((crop) => (

                <div
                  key={crop.name}
                  className={`rounded-[22px] border p-4 ${crop.bg} ${crop.border}`}
                >

                  {/* CROP HEADER */}

                  <div className="flex items-start justify-between gap-2">

                    <div className="flex items-center gap-3">

                      <span className="text-3xl">
                        {crop.emoji}
                      </span>

                      <div>

                        <h3 className="text-lg font-bold text-[#202820]">
                          {crop.name}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {crop.acres}
                        </p>

                      </div>

                    </div>

                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${crop.statusClass}`}
                    >
                      {crop.status}
                    </span>

                  </div>

                  {/* CROP WEATHER IMPACT ITEMS */}

                  <div className="mt-4 space-y-2">

                    {crop.items.map((item) => {

                      const Icon = item.icon;

                      return (
                        <div
                          key={item.title}
                          className="rounded-2xl bg-white/75 p-3"
                        >

                          <div className="flex items-start gap-2">

                            <Icon
                              size={18}
                              className={`mt-0.5 shrink-0 ${item.color}`}
                            />

                            <div>

                              <p className="text-sm font-bold text-[#303830]">
                                {item.title}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-gray-500">
                                {item.text}
                              </p>

                            </div>

                          </div>

                        </div>
                      );
                    })}

                  </div>

                  {/* ACTION */}

                  <div className="mt-3 rounded-2xl bg-white p-3">

                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      Your Action
                    </p>

                    <p className="mt-1 text-sm font-semibold leading-5 text-[#303830]">
                      {crop.action}
                    </p>

                  </div>

                </div>

              ))
            )}

          </div>

        </section>

        {/* ---------------- HOURLY FORECAST ---------------- */}

        <section className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-[#e5dfd2]">

          <h2 className="font-serif text-2xl font-bold text-[#202820]">
            Hourly Forecast — Today
          </h2>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">

            {hourly.map((item) => {

              const Icon = item.icon;

              return (
                <div
                  key={item.time}
                  className="min-w-[82px] rounded-2xl bg-[#eae7df] px-3 py-3 text-center"
                >

                  <p className="text-xs font-bold text-gray-500">
                    {item.time}
                  </p>

                  <Icon
                    size={20}
                    className={`mx-auto my-4 ${
                      item.icon === CloudRain
                        ? "text-blue-500"
                        : "text-yellow-500"
                    }`}
                  />

                  <p className="font-bold text-[#202820]">
                    {item.temp}
                  </p>

                  {item.rain && (
                    <p className="mt-2 text-xs font-semibold text-blue-500">
                      {item.rain}
                    </p>
                  )}

                </div>
              );
            })}

          </div>

        </section>

      </div>
    </Layout>
  );
}

/* ---------------- LOCATION ICON ---------------- */

function MapPinIcon() {
  return (
    <span className="text-base" aria-hidden="true">
      📍
    </span>
  );
}