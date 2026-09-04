import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
} from "lucide-react";

import { getWeather } from "./services/weatherApi.js";
import { getCurrentLocation } from "./services/location.js";
import { getLocationName } from "./services/geocodingApi.js";


/* ---------------- NAVIGATION ---------------- */

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "AI Copilot", icon: Mic, path: "/ai-copilot" },
  { label: "Weather", icon: CloudSun, path: "/weather" },
  { label: "Crop Scanner", icon: Camera, path: "/crop-scanner" },
  { label: "Mandi Market", icon: TrendingUp, path: "/mandi-market" },
  { label: "Farm Dashboard", icon: BarChart3, path: "/farm-dashboard" },
  { label: "Smart Alerts", icon: Bell, path: "/alerts", badge: 3 },
  { label: "Profile", icon: User, path: "/profile" },
];


/* ---------------- WEATHER HELPER ---------------- */

function getWeatherText(code) {
  if (code === 0) return "Clear Sky";

  if (code === 1 || code === 2) {
    return "Partly Cloudy";
  }

  if (code === 3) {
    return "Overcast";
  }

  if (
    code === 51 ||
    code === 53 ||
    code === 55 ||
    code === 56 ||
    code === 57
  ) {
    return "Drizzle";
  }

  if (
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 66 ||
    code === 67
  ) {
    return "Rain";
  }

  if (
    code === 80 ||
    code === 81 ||
    code === 82
  ) {
    return "Rain Showers";
  }

  if (
    code === 95 ||
    code === 96 ||
    code === 99
  ) {
    return "Thunderstorm";
  }

  return "Unknown";
}


/* ---------------- ALERTS ---------------- */

const ALERTS = [
  {
    emoji: "⚠️🐛",
    title: "Pest Monitoring",
    badge: "Monitor",
    description:
      "Inspect cotton regularly for pest or disease symptoms.",
    linkText: "Get Advice",
    theme: "red",
  },

  {
    emoji: "🌧️",
    title: "Rain Forecast",
    badge: null,
    description:
      "Check today's weather and adjust irrigation accordingly.",
    linkText: "View Weather",
    theme: "blue",
  },

  {
    emoji: "📈",
    title: "Tomato Prices Up",
    badge: null,
    description:
      "Check local mandi prices before deciding when to sell.",
    linkText: "See Prices",
    theme: "green",
  },

  {
    emoji: "🌡️",
    title: "Temperature",
    badge: null,
    description:
      "Monitor crop conditions during periods of high temperature.",
    linkText: "View Weather",
    theme: "orange",
  },
];


/* ---------------- STATS ---------------- */

const STATS = [
  {
    icon: Wheat,
    value: "58 Q",
    label: "Yield Estimate",
    sub: "+8% vs last season",
    theme: "green",
  },
  {
    icon: TrendingUp,
    value: "₹1.1L",
    label: "Expected Profit",
    sub: "This season",
    theme: "green",
  },
  {
    icon: Activity,
    value: "82/100",
    label: "Farm Health",
    sub: "Good condition",
    theme: "blue",
  },
  {
    icon: Bell,
    value: "3 New",
    label: "Alerts Today",
    sub: "Tap to review",
    theme: "red",
  },
];


/* ---------------- THEMES ---------------- */

const ALERT_THEMES = {
  red: {
    card: "bg-red-50 border-red-200",
    link: "text-red-600 hover:text-red-700",
    badge: "bg-red-600 text-white",
  },

  blue: {
    card: "bg-blue-50 border-blue-200",
    link: "text-[#1f5b3d] hover:text-[#173b27]",
  },

  green: {
    card: "bg-[#e7edda] border-[#c9d9bd]",
    link: "text-[#1f5b3d] hover:text-[#173b27]",
  },

  orange: {
    card: "bg-orange-50 border-orange-200",
    link: "text-[#1f5b3d] hover:text-[#173b27]",
  },
};


const STAT_THEMES = {
  green: "text-[#1f5b3d]",
  blue: "text-blue-600",
  red: "text-red-500",
};


/* ---------------- SIDEBAR ---------------- */

function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-[#e5dfd2] bg-white">

      {/* Logo */}

      <div className="flex items-center gap-2 px-5 py-5">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1f5b3d] text-white">
          <Wheat size={18} />
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


      {/* Navigation */}

      <nav className="flex-1 space-y-1 px-3">

        {NAV_ITEMS.map(
          ({ label, icon: Icon, path, badge }) => (

            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                label === "Home"
                  ? "bg-[#214d34] text-white shadow-sm"
                  : "text-slate-600 hover:bg-[#f4f1e7]"
              }`}
            >

              <span className="flex items-center gap-3">
                <Icon size={18} />
                {label}
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


      {/* User */}

      <div className="m-3 flex items-center gap-3 rounded-xl bg-[#f4f1e7] p-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8c29b] text-sm font-semibold text-[#5a4423]">
          RP
        </div>

        <div className="leading-tight">

          <p className="text-sm font-semibold text-[#24352a]">
            Ramesh Patil
          </p>

          <p className="text-xs text-slate-500">
            Nashik · Cotton, Wheat
          </p>

        </div>

      </div>

    </aside>
  );
}


/* ---------------- TOP BAR ---------------- */

function TopBar() {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between border-b border-[#e5dfd2] bg-white px-4 py-3 md:px-6">

      <h1 className="font-serif text-xl font-bold text-[#24352a]">
        Home
      </h1>

      <div className="flex items-center gap-4">

        <button
          onClick={() => navigate("/alerts")}
          className="relative text-slate-500 hover:text-slate-700"
          aria-label="Smart Alerts"
        >

          <Bell size={20} />

          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>

        </button>


        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5f0df] text-[#1f5b3d]">
          <User size={16} />
        </div>

      </div>

    </header>
  );
}


/* ---------------- HERO BANNER ---------------- */

function HeroBanner({
  weatherData,
  locationName,
  weatherLoading,
}) {
  const navigate = useNavigate();

  const FARM_HERO_URL =
    "https://i.pinimg.com/736x/38/ef/ad/38efadb7ab46f87f0353e4f449412e27.jpg";

  const current = weatherData?.current;

  const currentWeatherText = current
    ? getWeatherText(current.weather_code)
    : "--";

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

          <div className="max-w-md text-white">

            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              Good Morning <span>☀️</span>
            </p>

            <h2 className="mt-4 font-serif text-2xl font-bold sm:text-3xl">
              नमस्ते, रमेश जी!
            </h2>

            <p className="mt-5 text-sm font-semibold text-white">

              {weatherLoading
                ? "Loading your local weather..."
                : current
                ? `Current conditions: ${currentWeatherText}. Check your action plan for today's farming activities.`
                : "Check your weather and action plan for today's farming activities."}

            </p>

          </div>


          {/* LIVE WEATHER */}

          <div className="hidden shrink-0 rounded-xl bg-white/15 p-10 text-white backdrop-blur-sm sm:block">

            {weatherLoading ? (

              <p className="text-lg font-semibold">
                Loading weather...
              </p>

            ) : current ? (

              <>

                <p className="text-3xl font-bold">
                  {Math.round(
                    current.temperature_2m
                  )}°C
                </p>

                <p className="text-base text-white/90">

                  {locationName?.city ||
                    "Current Location"}

                  {locationName?.state
                    ? ` · ${locationName.state}`
                    : ""}

                  {" · "}

                  {currentWeatherText}

                </p>


                <div className="mt-3 flex gap-7 text-sm">

                  <span className="flex items-center gap-1">

                    <Droplets size={12} />

                    {Math.round(
                      current.relative_humidity_2m
                    )}%

                  </span>


                  <span className="flex items-center gap-1">

                    <Wind size={12} />

                    {Math.round(
                      current.wind_speed_10m
                    )} km/h

                  </span>

                </div>

              </>

            ) : (

              <p className="text-sm">
                Weather unavailable
              </p>

            )}

          </div>

        </div>


        {/* HERO BUTTONS */}

        <div className="flex flex-wrap gap-7">

          <button
            onClick={() => navigate("/ai-copilot")}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-1.5 text-sm font-semibold text-[#1f5b3d] shadow-sm hover:bg-[#e5f0df]"
          >

            <Mic size={16} />

            Talk to AI

          </button>


          <button
            onClick={() => navigate("/crop-scanner")}
            className="flex items-center gap-2 rounded-full bg-[#c23b22] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#a12f1a]"
          >

            <Camera size={16} />

            Scan Crop

          </button>

        </div>

      </div>

    </div>
  );
}


/* ---------------- ALERT CARD ---------------- */

function AlertCard({
  emoji,
  title,
  badge,
  description,
  linkText,
  theme,
}) {
  const t = ALERT_THEMES[theme];

  return (
    <div
      className={`rounded-xl border-2 p-5 ${t.card}`}
    >

      <div className="flex items-start justify-between gap-2">

        <p className="flex items-center gap-2 text-[15px] font-bold text-[#24352a]">

          <span>{emoji}</span>

          {title}

        </p>


        {badge && (
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${t.badge}`}
          >
            {badge}
          </span>
        )}

      </div>


      <p className="mt-1.5 text-sm text-slate-500">
        {description}
      </p>


      <button
        className={`mt-2 flex items-center gap-1 text-sm font-bold ${t.link}`}
      >

        {linkText}

        <ChevronRight size={14} />

      </button>

    </div>
  );
}


/* ---------------- ACTION PLAN ---------------- */

function ActionPlanBanner({
  weatherData,
}) {
  const navigate = useNavigate();

  const daily = weatherData?.daily;

  const tomorrowRain =
    daily?.precipitation_probability_max?.[1];

  let actionText =
    "Review today's weather before planning irrigation and field operations.";

  if (tomorrowRain != null) {

    if (tomorrowRain >= 60) {

      actionText =
        `Rain is likely tomorrow with a ${tomorrowRain}% precipitation probability. Avoid unnecessary irrigation today and check field drainage.`;

    } else if (tomorrowRain >= 30) {

      actionText =
        `There is a ${tomorrowRain}% chance of rain tomorrow. Monitor soil moisture and plan irrigation carefully.`;

    } else {

      actionText =
        `Only a ${tomorrowRain}% chance of rain is forecast for tomorrow. Plan irrigation according to soil moisture and crop needs.`;

    }
  }


  return (
    <div className="rounded-xl bg-[#e7edda] p-7">

      <div className="flex items-center gap-2.5">

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#214d34] text-white">

          <Zap size={16} />

        </div>


        <p className="font-serif text-xl font-bold text-[#24352a]">
          Today's AI Action Plan
        </p>

      </div>


      <p className="mt-3 text-sm text-[#3d4d40]">
        {actionText}
      </p>


      <button
        onClick={() => navigate("/ai-copilot")}
        className="mt-4 flex items-center gap-2 rounded-full bg-[#214d34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173b27]"
      >

        <Mic size={14} />

        Ask AI for Details

      </button>

    </div>
  );
}


/* ---------------- STAT CARD ---------------- */

function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  theme,
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e5dfd2]">

      <div className="flex items-center justify-between">

        <Icon
          size={18}
          className={STAT_THEMES[theme]}
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

    </div>
  );
}


/* ---------------- DASHBOARD ---------------- */

export default function KrishiShayakDashboard() {

  const [weatherData, setWeatherData] =
    useState(null);

  const [locationName, setLocationName] =
    useState(null);

  const [weatherLoading, setWeatherLoading] =
    useState(true);


  /* ---------------- LOAD LOCATION + WEATHER ---------------- */

  useEffect(() => {

    async function loadDashboardWeather() {

      try {

        setWeatherLoading(true);

        // Get user's coordinates
        const location =
          await getCurrentLocation();

        // Convert coordinates into city/state
        const locationData =
          await getLocationName(
            location.latitude,
            location.longitude
          );

        // Fetch weather
        const data =
          await getWeather(
            location.latitude,
            location.longitude
          );

        console.log(
          "Dashboard location:",
          locationData
        );

        console.log(
          "Dashboard weather:",
          data
        );

        setLocationName(locationData);
        setWeatherData(data);

      } catch (error) {

        console.error(
          "Dashboard weather loading failed:",
          error
        );

      } finally {

        setWeatherLoading(false);

      }
    }


    loadDashboardWeather();

  }, []);


  return (
    <div className="flex h-screen w-full bg-[#faf7ef] font-sans text-[#24352a]">

      <Sidebar />


      <div className="flex flex-1 flex-col overflow-hidden">

        <TopBar />


        <main className="flex-1 overflow-y-auto p-4 md:p-6">

          <div className="mx-auto max-w-5xl space-y-6">


            {/* HERO */}

            <HeroBanner
              weatherData={weatherData}
              locationName={locationName}
              weatherLoading={weatherLoading}
            />


            {/* ALERTS */}

            <div>

              <div className="mb-3 flex items-center justify-between">

                <h3 className="font-serif text-lg font-semibold text-[#24352a]">
                  Today's Alerts
                </h3>


                <button
                  onClick={() => navigate("/alerts")}
                  className="flex items-center gap-1 text-sm font-medium text-[#1f5b3d] hover:text-[#173b27]"
                >
                  View All
                  <ChevronRight size={14} />
                </button>

              </div>


              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                {ALERTS.map((alert) => (

                  <AlertCard
                    key={alert.title}
                    {...alert}
                  />

                ))}

              </div>

            </div>


            {/* AI ACTION PLAN */}

            <ActionPlanBanner
              weatherData={weatherData}
            />


            {/* STATS */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {STATS.map((stat) => (

                <StatCard
                  key={stat.label}
                  {...stat}
                />

              ))}

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}