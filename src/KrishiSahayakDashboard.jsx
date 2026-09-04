import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Home,
  Mic,
  CloudSun,
  Camera,
  TrendingUp,
  BarChart3,
  Bell,
  User,
  Zap,
  Wheat,
  Activity,
  ChevronRight,
  Wind,
  Droplets,
  Bug,
  CloudRain,
  ThermometerSun,
  Sun,
  LogOut,
  MapPin,
  Leaf,
} from "lucide-react";

import {
  useAuth,
} from "./context/AuthContext";

import {
  logout,
} from "./services/auth";

import {
  useLanguage,
} from "./context/LanguageContext";

import {
  translateTexts,
} from "./services/translation";

import {
  getWeather,
} from "./services/weatherApi.js";

import {
  getCoordinatesFromLocation,
} from "./services/geocodingApi.js";

// ---------------------------------------------------------
// NAVIGATION
// ---------------------------------------------------------

const NAV_ITEMS = [
  {
    key: "home",
    icon: Home,
    path: "/dashboard",
  },
  {
    key: "aiCopilot",
    icon: Mic,
    path: "/ai-copilot",
  },
  {
    key: "weather",
    icon: CloudSun,
    path: "/weather",
  },
  {
    key: "cropScanner",
    icon: Camera,
    path: "/crop-scanner",
  },
  {
    key: "mandiMarket",
    icon: TrendingUp,
    path: "/mandi-market",
  },
  {
    key: "farmDashboard",
    icon: BarChart3,
    path: "/farm-dashboard",
  },
  {
    key: "smartAlerts",
    icon: Bell,
    path: "/alerts",
    badge: 3,
  },
  {
    key: "profile",
    icon: User,
    path: "/profile",
  },
];

// ---------------------------------------------------------
// WEATHER HELPER
// ---------------------------------------------------------

function getWeatherText(code) {
  if (code === 0) {
    return "Clear Sky";
  }

  if (
    code === 1 ||
    code === 2
  ) {
    return "Partly Cloudy";
  }

  if (code === 3) {
    return "Overcast";
  }

  if (
    [51, 53, 55, 56, 57].includes(
      code
    )
  ) {
    return "Drizzle";
  }

  if (
    [61, 63, 65, 66, 67].includes(
      code
    )
  ) {
    return "Rain";
  }

  if (
    [71, 73, 75, 77].includes(
      code
    )
  ) {
    return "Snow";
  }

  if (
    [80, 81, 82].includes(
      code
    )
  ) {
    return "Rain Showers";
  }

  if (
    [85, 86].includes(
      code
    )
  ) {
    return "Snow Showers";
  }

  if (
    [95, 96, 99].includes(
      code
    )
  ) {
    return "Thunderstorm";
  }

  return "Unknown";
}

// ---------------------------------------------------------
// THEMES
// ---------------------------------------------------------

const ALERT_THEMES = {
  red: {
    card:
      "bg-red-50 border-red-200",
    link:
      "text-red-600 hover:text-red-700",
    badge:
      "bg-red-600 text-white",
    icon:
      "text-red-600",
  },

  blue: {
    card:
      "bg-blue-50 border-blue-200",
    link:
      "text-[#1f5b3d] hover:text-[#173b27]",
    badge:
      "bg-blue-600 text-white",
    icon:
      "text-blue-600",
  },

  green: {
    card:
      "bg-[#e7edda] border-[#c9d9bd]",
    link:
      "text-[#1f5b3d] hover:text-[#173b27]",
    badge:
      "bg-[#1f5b3d] text-white",
    icon:
      "text-[#1f5b3d]",
  },

  orange: {
    card:
      "bg-orange-50 border-orange-200",
    link:
      "text-[#1f5b3d] hover:text-[#173b27]",
    badge:
      "bg-orange-600 text-white",
    icon:
      "text-orange-600",
  },
};

const STAT_THEMES = {
  green:
    "text-[#1f5b3d]",
  blue:
    "text-blue-600",
  red:
    "text-red-500",
};

// ---------------------------------------------------------
// ENGLISH UI TEXT
// ---------------------------------------------------------

const ENGLISH_TEXTS = {
  nav: {
    home: "Home",
    aiCopilot: "AI Copilot",
    weather: "Weather",
    cropScanner: "Crop Scanner",
    mandiMarket: "Mandi Market",
    farmDashboard: "Farm Dashboard",
    smartAlerts: "Smart Alerts",
    profile: "Profile",
  },

  user: {
    locationUnavailable:
      "Location unavailable",
    noCrops:
      "No crops added",
  },

  topbar: {
    home: "Home",
    smartAlerts:
      "Smart Alerts",
    logout:
      "Logout",
  },

  hero: {
    goodMorning:
      "Good Morning",
    greeting:
      "Namaste!",
    loadingWeather:
      "Loading your local weather...",
    weatherUnavailable:
      "Weather unavailable",
    currentLocation:
      "Current Location",
    farmStatus:
      "Your farm information is loaded from your onboarding profile.",
    talkToAI:
      "Talk to AI",
    scanCrop:
      "Scan Crop",
  },

  alerts: {
    heading:
      "Today's Alerts",
    viewAll:
      "View All",

    rain:
      "Rain Forecast",
    rainDescription:
      "Check the forecast and adjust irrigation for your farm.",
    viewWeather:
      "View Weather",

    heat:
      "High Temperature",
    heatDescription:
      "Monitor water stress in your crops during hot conditions.",

    pest:
      "Crop Monitoring",
    pestDescription:
      "Inspect your crops regularly for pest or disease symptoms.",
    getAdvice:
      "Get Advice",

    humidity:
      "Pest & Disease Watch",
    humidityDescription:
      "High humidity can increase disease pressure in crops.",

    market:
      "Market Prices",
    marketDescription:
      "Check current mandi prices for your crops before selling.",
    seePrices:
      "See Prices",

    monitor:
      "Monitor",
  },

  actionPlan: {
    title:
      "Today's AI Action Plan",
    defaultDescription:
      "Review today's weather before planning irrigation and field operations.",
    rainDescription:
      "Rain is likely tomorrow. Check drainage and avoid unnecessary irrigation today.",
    moderateRainDescription:
      "There is a moderate chance of rain tomorrow. Monitor soil moisture and plan irrigation carefully.",
    lowRainDescription:
      "Only a low chance of rain is forecast for tomorrow. Plan irrigation according to soil moisture.",
    askAI:
      "Ask AI for Details",
  },

  stats: {
    crop:
      "Current Crops",
    farmArea:
      "Farm Area",
    location:
      "Farm Location",
    humidity:
      "Current Humidity",
    liveWeather:
      "Live weather",
    fromOnboarding:
      "From onboarding",
    noCrops:
      "No crops added",
    noLocation:
      "Location unavailable",
    alerts:
      "Alerts Today",
    review:
      "Tap to review",
  },
};

// ---------------------------------------------------------
// TRANSLATION HELPERS
// ---------------------------------------------------------

function flattenTexts(
  obj,
  prefix = "",
  result = {}
) {
  Object.entries(obj).forEach(
    ([key, value]) => {
      const fullKey =
        prefix
          ? `${prefix}.${key}`
          : key;

      if (
        typeof value ===
          "object" &&
        value !== null
      ) {
        flattenTexts(
          value,
          fullKey,
          result
        );
      } else {
        result[fullKey] = value;
      }
    }
  );

  return result;
}

function setNestedValue(
  obj,
  path,
  value
) {
  const keys =
    path.split(".");

  let current = obj;

  keys.forEach(
    (key, index) => {
      if (
        index ===
        keys.length - 1
      ) {
        current[key] = value;
      } else {
        if (!current[key]) {
          current[key] = {};
        }

        current =
          current[key];
      }
    }
  );
}

function buildTranslatedObject(
  keys,
  values
) {
  const result = {};

  keys.forEach(
    (key, index) => {
      setNestedValue(
        result,
        key,
        values[index]
      );
    }
  );

  return result;
}

// ---------------------------------------------------------
// SIDEBAR
// ---------------------------------------------------------

function Sidebar({
  t,
  language,
  farmerData,
}) {
  const navigate =
    useNavigate();

  const profile =
    farmerData?.profile ||
    null;

  const farm =
    farmerData?.farm ||
    null;

  const crops =
    farmerData?.crops ||
    [];

  const userName =
    profile?.name ||
    "Farmer";

  const initials =
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(
        (word) =>
          word[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "F";

  const district =
    profile?.district ||
    farm?.district ||
    "";

  const state =
    profile?.state ||
    farm?.state ||
    "";

  const location =
    district ||
    state ||
    t.user.locationUnavailable;

  const cropNames =
    crops
      .map(
        (crop) =>
          crop?.crop_name
      )
      .filter(Boolean);

  return (
    <aside className="hidden shrink-0 flex-col border-r border-[#e5dfd2] bg-white md:flex md:w-60 lg:w-64">

      {/* LOGO */}

      <div className="flex items-center gap-2 px-5 py-5">

        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl">
          <img
            src="/logo.png"
            alt="KrishiSahayak"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="leading-tight">

          <p className="font-serif text-sm font-bold text-[#254a32]">
            KrishiSahayak
          </p>

          <p className="text-xs text-slate-500">
            AI Farming Copilot
          </p>

        </div>

      </div>

      {/* NAVIGATION */}

      <nav className="flex-1 space-y-1 px-3">

        {NAV_ITEMS.map(
          ({
            key,
            icon: Icon,
            path,
            badge,
          }) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                navigate(path)
              }
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                key === "home"
                  ? "bg-[#214d34] text-white shadow-sm"
                  : "text-slate-600 hover:bg-[#f4f1e7]"
              }`}
            >

              <span className="flex items-center gap-3">

                <Icon size={18} />

                {key === "weather" &&
                (language === "hi" ||
                  language === "hi-IN")
                  ? "मौसम"
                  : t.nav[key]}

              </span>

              {badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}

            </button>
          )
        )}

      </nav>

      {/* USER */}

      <div className="m-3 flex items-center gap-3 rounded-xl bg-[#f4f1e7] p-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d8c29b] text-sm font-semibold text-[#5a4423]">
          {initials}
        </div>

        <div className="min-w-0 leading-tight">

          <p className="truncate text-sm font-semibold text-[#24352a]">
            {userName}
          </p>

          <p className="truncate text-xs text-slate-500">
            {location}

            {cropNames.length > 0 && (
              <>
                {" · "}
                {cropNames.join(
                  ", "
                )}
              </>
            )}
          </p>

        </div>

      </div>

    </aside>
  );
}

// ---------------------------------------------------------
// TOP BAR
// ---------------------------------------------------------

function TopBar({
  t,
}) {
  const navigate =
    useNavigate();

  async function handleLogout() {
    try {
      await logout();

      navigate(
        "/",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-[#e5dfd2] bg-white px-4 py-3 md:px-6">

      <h1 className="font-serif text-xl font-bold text-[#24352a]">
        {t.topbar.home}
      </h1>

      <div className="flex items-center gap-4">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/alerts"
            )
          }
          className="relative text-slate-500 hover:text-slate-700"
          aria-label={
            t.topbar.smartAlerts
          }
        >

          <Bell size={20} />

          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>

        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/profile"
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5f0df] text-[#1f5b3d]"
          aria-label={
            t.nav.profile
          }
        >
          <User size={16} />
        </button>

        <button
          type="button"
          onClick={
            handleLogout
          }
          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
          aria-label={
            t.topbar.logout
          }
          title={
            t.topbar.logout
          }
        >
          <LogOut size={17} />
        </button>

      </div>

    </header>
  );
}

// ---------------------------------------------------------
// HERO
// ---------------------------------------------------------

function HeroBanner({
  t,
  language,
  profile,
  farm,
  crops,
  weatherData,
  locationName,
  weatherLoading,
}) {
  const navigate =
    useNavigate();

  const FARM_HERO_URL =
    "https://i.pinimg.com/736x/38/ef/ad/38efadb7ab46f87f0353e4f449412e27.jpg";

  const current =
    weatherData?.current;

  const weatherText =
    current
      ? getWeatherText(
          current.weather_code
        )
      : null;

  const farmerName =
    profile?.name ||
    "Farmer";

  const firstName =
    farmerName
      .trim()
      .split(/\s+/)[0] ||
    "Farmer";

  const greeting =
    language === "hi" ||
    language === "hi-IN"
      ? `नमस्ते, ${firstName} जी!`
      : `Namaste, ${firstName} ji!`;

  const cropNames =
    crops
      .map(
        (crop) =>
          crop?.crop_name
      )
      .filter(Boolean);

  const area =
    farm?.area !== null &&
    farm?.area !== undefined &&
    farm?.area !== ""
      ? `${farm.area} ${
          farm.area_unit ||
          "acre"
        }`
      : "";

  return (
    <div className="relative overflow-hidden rounded-2xl">

      <div
        className="h-72 w-full bg-cover bg-center sm:h-64"
        style={{
          backgroundImage: `url(${FARM_HERO_URL})`,
        }}
      />

      <div className="absolute inset-0 bg-[#1f5b3d]/40" />

      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">

        <div className="flex items-start justify-between gap-4">

          <div className="max-w-xl text-white">

            <p className="flex items-center gap-2 text-sm font-semibold">
              {language === "hi" ||
              language === "hi-IN"
                ? "सुप्रभात"
                : t.hero.goodMorning}

              <Sun size={16} />
            </p>

            <h2 className="mt-4 font-serif text-2xl font-bold sm:text-3xl">
              {greeting}
            </h2>

            {/* ONBOARDING INFORMATION */}

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-white/90">

              {locationName && (
                <span className="flex items-center gap-1">
                  <MapPin size={15} />

                  {locationName.city}

                  {locationName.state
                    ? `, ${locationName.state}`
                    : ""}
                </span>
              )}

              {area && (
                <span className="flex items-center gap-1">
                  <Wheat size={15} />
                  {area}
                </span>
              )}

              {cropNames.length > 0 && (
                <span className="flex items-center gap-1">
                  <Leaf size={15} />
                  {cropNames.join(
                    ", "
                  )}
                </span>
              )}

            </div>

            <p className="mt-4 text-sm font-semibold text-white">
              {weatherLoading
                ? t.hero.loadingWeather
                : current
                ? `${weatherText}. ${t.hero.farmStatus}`
                : t.hero.farmStatus}
            </p>

          </div>

          {/* LIVE WEATHER */}

          <div className="hidden min-w-[240px] shrink-0 rounded-xl bg-white/15 p-7 text-white backdrop-blur-sm sm:block">

            {weatherLoading ? (

              <p className="text-lg font-semibold">
                {t.hero.loadingWeather}
              </p>

            ) : current ? (

              <>

                <p className="text-3xl font-bold">
                  {Math.round(
                    current.temperature_2m
                  )}
                  °C
                </p>

                <p className="text-base text-white/90">
                  {locationName?.city ||
                    t.hero.currentLocation}

                  {locationName?.state
                    ? ` · ${locationName.state}`
                    : ""}
                </p>

                <p className="mt-1 text-sm text-white/90">
                  {weatherText}
                </p>

                <div className="mt-4 flex gap-6 text-sm">

                  <span className="flex items-center gap-1">
                    <Droplets size={13} />

                    {Number.isFinite(
                      Number(
                        current.relative_humidity_2m
                      )
                    )
                      ? `${Math.round(
                          current.relative_humidity_2m
                        )}%`
                      : "--"}
                  </span>

                  <span className="flex items-center gap-1">
                    <Wind size={13} />

                    {Number.isFinite(
                      Number(
                        current.wind_speed_10m
                      )
                    )
                      ? `${Math.round(
                          current.wind_speed_10m
                        )} km/h`
                      : "--"}
                  </span>

                </div>

              </>

            ) : (

              <p className="text-sm">
                {t.hero.weatherUnavailable}
              </p>

            )}

          </div>

        </div>

        {/* HERO BUTTONS */}

        <div className="flex flex-wrap gap-7">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/ai-copilot"
              )
            }
            className="flex items-center gap-2 rounded-full bg-white px-5 py-1.5 text-sm font-semibold text-[#1f5b3d] shadow-sm hover:bg-[#e5f0df]"
          >
            <Mic size={16} />
            {t.hero.talkToAI}
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/crop-scanner"
              )
            }
            className="flex items-center gap-2 rounded-full bg-[#c23b22] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#a12f1a]"
          >

            <Camera size={16} />

            {t.hero.scanCrop}

          </button>

        </div>

      </div>

    </div>
  );
}

// ---------------------------------------------------------
// ALERT CARD
// ---------------------------------------------------------

function AlertCard({
  icon: Icon,
  title,
  badge,
  description,
  linkText,
  path,
  theme,
}) {
  const navigate =
    useNavigate();

  const themeStyles =
    ALERT_THEMES[theme] ||
    ALERT_THEMES.blue;

  return (
    <div
      className={`rounded-xl border-2 p-5 ${themeStyles.card}`}
    >

      <div className="flex items-start justify-between gap-2">

        <p className="flex items-center gap-2 text-[15px] font-bold text-[#24352a]">

          <Icon
            size={18}
            className={
              themeStyles.icon
            }
          />

          {title}

        </p>

        {badge && (
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${themeStyles.badge}`}
          >
            {badge}
          </span>
        )}

      </div>

      <p className="mt-1.5 text-sm text-slate-500">
        {description}
      </p>

      <button
        type="button"
        onClick={() =>
          navigate(path)
        }
        className={`mt-2 flex items-center gap-1 text-sm font-bold ${themeStyles.link}`}
      >
        {linkText}

        <ChevronRight
          size={14}
        />
      </button>

    </div>
  );
}

// ---------------------------------------------------------
// CREATE DYNAMIC ALERTS
// ---------------------------------------------------------

function createAlerts({
  weatherData,
  crops,
  t,
}) {
  const alerts = [];

  const current =
    weatherData?.current;

  const daily =
    weatherData?.daily;

  const cropNames =
    crops
      .map(
        (crop) =>
          crop?.crop_name
      )
      .filter(Boolean);

  const cropName =
    cropNames[0] ||
    "your crops";

  const tomorrowRain =
    Number(
      daily
        ?.precipitation_probability_max?.[
        1
      ]
    );

  const maxTemperature =
    Array.isArray(
      daily?.temperature_2m_max
    ) &&
    daily.temperature_2m_max.length
      ? Math.max(
          ...daily.temperature_2m_max.slice(
            0,
            7
          )
        )
      : null;

  const humidity =
    Number(
      current
        ?.relative_humidity_2m
    );

  // -------------------------------------------------------
  // WEATHER ALERT
  // -------------------------------------------------------

  if (
    Number.isFinite(
      tomorrowRain
    ) &&
    tomorrowRain >= 60
  ) {
    alerts.push({
      icon:
        CloudRain,
      title:
        t.alerts.rain,
      badge:
        t.alerts.monitor,
      description:
        `${t.alerts.rainDescription} ${tomorrowRain}% rain probability.`,
      linkText:
        t.alerts.viewWeather,
      path: "/weather",
      theme: "blue",
    });
  } else {
    alerts.push({
      icon:
        CloudRain,
      title:
        t.alerts.rain,
      badge: null,
      description:
        t.alerts.rainDescription,
      linkText:
        t.alerts.viewWeather,
      path: "/weather",
      theme: "blue",
    });
  }

  // -------------------------------------------------------
  // TEMPERATURE ALERT
  // -------------------------------------------------------

  if (
    Number.isFinite(
      Number(maxTemperature)
    ) &&
    Number(maxTemperature) >= 38
  ) {
    alerts.push({
      icon:
        ThermometerSun,
      title:
        t.alerts.heat,
      badge:
        t.alerts.monitor,
      description:
        `${t.alerts.heatDescription} ${Math.round(
          maxTemperature
        )}°C forecast.`,
      linkText:
        t.alerts.viewWeather,
      path: "/weather",
      theme: "orange",
    });
  }

  // -------------------------------------------------------
  // HUMIDITY / PEST ALERT
  // -------------------------------------------------------

  if (
    Number.isFinite(humidity) &&
    humidity >= 80
  ) {
    alerts.push({
      icon:
        Bug,
      title:
        t.alerts.humidity,
      badge:
        t.alerts.monitor,
      description:
        `${t.alerts.humidityDescription} Monitor ${cropName}.`,
      linkText:
        t.alerts.getAdvice,
      path: "/ai-copilot",
      theme: "red",
    });
  } else {
    alerts.push({
      icon:
        Bug,
      title:
        t.alerts.pest,
      badge:
        t.alerts.monitor,
      description:
        `${t.alerts.pestDescription} ${cropName}.`,
      linkText:
        t.alerts.getAdvice,
      path: "/ai-copilot",
      theme: "red",
    });
  }

  // -------------------------------------------------------
  // MARKET
  // -------------------------------------------------------

  alerts.push({
    icon:
      TrendingUp,
    title:
      t.alerts.market,
    badge: null,
    description:
      t.alerts.marketDescription,
    linkText:
      t.alerts.seePrices,
    path: "/mandi-market",
    theme: "green",
  });

  return alerts.slice(
    0,
    4
  );
}

// ---------------------------------------------------------
// ACTION PLAN
// ---------------------------------------------------------

function ActionPlanBanner({
  t,
  weatherData,
}) {
  const navigate =
    useNavigate();

  const tomorrowRain =
    Number(
      weatherData
        ?.daily
        ?.precipitation_probability_max?.[
        1
      ]
    );

  let description =
    t.actionPlan.defaultDescription;

  if (
    Number.isFinite(
      tomorrowRain
    )
  ) {
    if (
      tomorrowRain >= 60
    ) {
      description =
        `${t.actionPlan.rainDescription} (${tomorrowRain}%).`;
    } else if (
      tomorrowRain >= 30
    ) {
      description =
        `${t.actionPlan.moderateRainDescription} (${tomorrowRain}%).`;
    } else {
      description =
        `${t.actionPlan.lowRainDescription} (${tomorrowRain}%).`;
    }
  }

  return (
    <div className="rounded-xl bg-[#e7edda] p-7">

      <div className="flex items-center gap-2.5">

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#214d34] text-white">
          <Zap size={16} />
        </div>

        <p className="font-serif text-xl font-bold text-[#24352a]">
          {t.actionPlan.title}
        </p>

      </div>

      <p className="mt-3 text-sm text-[#3d4d40]">
        {description}
      </p>

      <button
        type="button"
        onClick={() =>
          navigate(
            "/ai-copilot"
          )
        }
        className="mt-4 flex items-center gap-2 rounded-full bg-[#214d34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173b27]"
      >

        <Mic size={14} />

        {t.actionPlan.askAI}

      </button>

    </div>
  );
}

// ---------------------------------------------------------
// STAT CARD
// ---------------------------------------------------------

function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  theme,
  path,
}) {
  const navigate =
    useNavigate();

  return (
    <button
      type="button"
      onClick={() =>
        navigate(path)
      }
      className="w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-[#e5dfd2] transition hover:-translate-y-0.5 hover:shadow-md"
    >

      <div className="flex items-center justify-between">

        <Icon
          size={18}
          className={
            STAT_THEMES[theme]
          }
        />

        <ChevronRight
          size={16}
          className="text-slate-300"
        />

      </div>

      <p
        className={`mt-2 text-xl font-bold ${STAT_THEMES[theme]}`}
      >
        {value}
      </p>

      <p className="mt-0.5 text-sm font-medium text-[#24352a]">
        {label}
      </p>

      <p className="text-xs text-slate-400">
        {sub}
      </p>

    </button>
  );
}

// ---------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------

export default function KrishiSahayakDashboard() {
  const {
    user,
    farmerData,
  } = useAuth();

  const {
    language,
  } = useLanguage();

  // -------------------------------------------------------
  // ONBOARDING DATA
  // -------------------------------------------------------

  const profile =
    farmerData?.profile ||
    null;

  const farm =
    farmerData?.farm ||
    null;

  const crops =
    farmerData?.crops ||
    [];

  // -------------------------------------------------------
  // WEATHER STATE
  // -------------------------------------------------------

  const [
    weatherData,
    setWeatherData,
  ] = useState(null);

  const [
    locationName,
    setLocationName,
  ] = useState(null);

  const [
    weatherLoading,
    setWeatherLoading,
  ] = useState(true);

  // -------------------------------------------------------
  // TRANSLATION STATE
  // -------------------------------------------------------

  const [
    translated,
    setTranslated,
  ] = useState(
    ENGLISH_TEXTS
  );

  const [
    translationLoading,
    setTranslationLoading,
  ] = useState(false);

  // -------------------------------------------------------
  // TRANSLATE DASHBOARD
  // -------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function translateDashboard() {
      if (
        !language ||
        language === "en"
      ) {
        setTranslated(
          ENGLISH_TEXTS
        );

        setTranslationLoading(
          false
        );

        return;
      }

      try {
        setTranslationLoading(
          true
        );

        const flattened =
          flattenTexts(
            ENGLISH_TEXTS
          );

        const keys =
          Object.keys(
            flattened
          );

        const values =
          Object.values(
            flattened
          );

        const translatedValues =
          await translateTexts(
            values,
            language,
            "en"
          );

        if (cancelled) {
          return;
        }

        setTranslated(
          buildTranslatedObject(
            keys,
            translatedValues
          )
        );
      } catch (error) {
        console.error(
          "Dashboard translation failed:",
          error
        );

        if (!cancelled) {
          setTranslated(
            ENGLISH_TEXTS
          );
        }
      } finally {
        if (!cancelled) {
          setTranslationLoading(
            false
          );
        }
      }
    }

    translateDashboard();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const t =
    translationLoading
      ? ENGLISH_TEXTS
      : translated;

  // -------------------------------------------------------
  // LOAD WEATHER FOR ONBOARDING LOCATION
  // -------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardWeather() {
      try {
        setWeatherLoading(
          true
        );

        if (!user) {
          if (!cancelled) {
            setWeatherData(
              null
            );

            setLocationName(
              null
            );
          }

          return;
        }

        const state =
          profile?.state?.trim() ||
          farm?.state?.trim() ||
          "";

        const district =
          profile?.district?.trim() ||
          farm?.district?.trim() ||
          "";

        if (
          !state ||
          !district
        ) {
          console.warn(
            "Incomplete onboarding location:",
            {
              state,
              district,
            }
          );

          if (!cancelled) {
            setWeatherData(
              null
            );

            setLocationName(
              null
            );
          }

          return;
        }

        console.log(
          "Home dashboard onboarding data:",
          {
            name:
              profile?.name,
            state,
            district,
            farmArea:
              farm?.area,
            farmUnit:
              farm?.area_unit,
            crops,
          }
        );

        const coordinates =
          await getCoordinatesFromLocation(
            state,
            district
          );

        console.log(
          "Dashboard coordinates:",
          coordinates
        );

        const data =
          await getWeather(
            coordinates.latitude,
            coordinates.longitude
          );

        console.log(
          "Dashboard live weather:",
          data
        );

        if (cancelled) {
          return;
        }

        setLocationName({
          city:
            district,
          state,
        });

        setWeatherData(
          data
        );
      } catch (error) {
        console.error(
          "Dashboard weather loading failed:",
          error
        );

        if (!cancelled) {
          setWeatherData(
            null
          );

          setLocationName(
            null
          );
        }
      } finally {
        if (!cancelled) {
          setWeatherLoading(
            false
          );
        }
      }
    }

    loadDashboardWeather();

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    profile?.state,
    profile?.district,
    farm?.state,
    farm?.district,
  ]);

  // -------------------------------------------------------
  // DYNAMIC ALERTS
  // -------------------------------------------------------

  const alerts =
    createAlerts({
      weatherData,
      crops,
      t,
    });

  // -------------------------------------------------------
  // ONBOARDING VALUES FOR STATS
  // -------------------------------------------------------

  const cropNames =
    crops
      .map(
        (crop) =>
          crop?.crop_name
      )
      .filter(Boolean);

  const cropCount =
    cropNames.length;

  const farmArea =
    farm?.area !== null &&
    farm?.area !== undefined &&
    farm?.area !== ""
      ? `${farm.area} ${
          farm.area_unit ||
          "acre"
        }`
      : "—";

  const farmerLocation =
    profile?.district ||
    farm?.district ||
    profile?.state ||
    farm?.state ||
    "—";

  const currentHumidity =
    Number.isFinite(
      Number(
        weatherData?.current
          ?.relative_humidity_2m
      )
    )
      ? `${Math.round(
          weatherData.current
            .relative_humidity_2m
        )}%`
      : "—";

  // -------------------------------------------------------
  // STATS
  // -------------------------------------------------------

  const stats = [
    {
      icon: Wheat,
      value:
        cropCount > 0
          ? `${cropCount}`
          : "—",
      label:
        t.stats.crop,
      sub:
        cropCount > 0
          ? cropNames.join(
              ", "
            )
          : t.stats.noCrops,
      theme:
        "green",
      path:
        "/profile",
    },

    {
      icon:
        BarChart3,
      value:
        farmArea,
      label:
        t.stats.farmArea,
      sub:
        t.stats.fromOnboarding,
      theme:
        "green",
      path:
        "/farm-dashboard",
    },

    {
      icon:
        MapPin,
      value:
        farmerLocation,
      label:
        t.stats.location,
      sub:
        t.stats.fromOnboarding,
      theme:
        "blue",
      path:
        "/profile",
    },

    {
      icon:
        Activity,
      value:
        currentHumidity,
      label:
        t.stats.humidity,
      sub:
        weatherData?.current
          ? t.stats.liveWeather
          : t.stats.noLocation,
      theme:
        "blue",
      path:
        "/weather",
    },
  ];

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (
    <div className="flex h-screen w-full bg-[#faf7ef] font-sans text-[#24352a]">

      <Sidebar
        t={t}
        language={language}
        farmerData={
          farmerData
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden">

        <TopBar t={t} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">

          <div className="mx-auto max-w-5xl space-y-6">

            {/* ==================================================
                HERO
            ================================================== */}

            <HeroBanner
              t={t}
              language={
                language
              }
              farmerName={
                profile?.name
              }
              profile={
                profile
              }
              farm={farm}
              crops={crops}
              weatherData={
                weatherData
              }
              locationName={
                locationName
              }
              weatherLoading={
                weatherLoading
              }
            />

            {/* ==================================================
                ALERTS
            ================================================== */}

            <div>

              <div className="mb-3 flex items-center justify-between">

                <h3 className="font-serif text-lg font-semibold text-[#24352a]">
                  {
                    t.alerts.heading
                  }
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    window.location.assign(
                      "/alerts"
                    )
                  }
                  className="flex items-center gap-1 text-sm font-medium text-[#1f5b3d] hover:text-[#173b27]"
                >

                  {
                    t.alerts.viewAll
                  }

                  <ChevronRight
                    size={14}
                  />

                </button>

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                {alerts.map(
                  (
                    alert,
                    index
                  ) => (
                    <AlertCard
                      key={`${alert.title}-${index}`}
                      {...alert}
                    />
                  )
                )}

              </div>

            </div>

            {/* ==================================================
                ACTION PLAN
            ================================================== */}

            <ActionPlanBanner
              t={t}
              weatherData={
                weatherData
              }
            />

            {/* ==================================================
                STATS
            ================================================== */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {stats.map(
                (stat) => (
                  <StatCard
                    key={
                      stat.label
                    }
                    {...stat}
                  />
                )
              )}

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}