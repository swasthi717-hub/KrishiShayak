import React from "react";

import {
  Sun,
  CloudRain,
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  Umbrella,
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

const forecast = [
  {
    day: "Today",
    icon: Sun,
    high: "34°",
    low: "24°",
    rain: null,
    active: true,
  },
  {
    day: "Tue",
    icon: CloudRain,
    high: "30°",
    low: "22°",
    rain: "75%",
  },
  {
    day: "Wed",
    icon: CloudRain,
    high: "27°",
    low: "20°",
    rain: "90%",
  },
  {
    day: "Thu",
    icon: CloudRain,
    high: "28°",
    low: "21°",
    rain: "60%",
  },
  {
    day: "Fri",
    icon: Sun,
    high: "31°",
    low: "23°",
    rain: null,
  },
  {
    day: "Sat",
    icon: Sun,
    high: "33°",
    low: "24°",
    rain: null,
  },
  {
    day: "Sun",
    icon: Sun,
    high: "35°",
    low: "25°",
    rain: null,
  },
];

const riskAlerts = [
  {
    title: "Heavy Rain",
    text: "80mm rain expected Wednesday. Drain fields.",
    label: "High Risk",
    icon: CloudRain,
    box: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-500",
    badge: "bg-red-100 text-red-600",
  },
  {
    title: "Heatwave",
    text: "Temp >40°C Tuesday. Increase irrigation.",
    label: "Next Week",
    icon: Thermometer,
    box: "bg-red-50 border-red-200",
    iconColor: "text-red-500",
    badge: "bg-orange-100 text-orange-600",
  },
  {
    title: "Frost Risk",
    text: "No frost expected this week. Monitor.",
    label: "Low Risk",
    icon: Snowflake,
    box: "bg-sky-50 border-sky-200",
    iconColor: "text-sky-500",
    badge: "bg-green-100 text-green-700",
  },
  {
    title: "Pest Risk",
    text: "Humid conditions favor bollworm. Inspect.",
    label: "High Risk",
    icon: Bug,
    box: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-500",
    badge: "bg-red-100 text-red-600",
  },
];

const actionPlan = [
  "Apply fungicide before 10 AM (before rain arrives)",
  "Skip all irrigation today — rain tomorrow",
  "Inspect cotton field for bollworm signs",
  "Harvest ripe tomatoes before rain (done)",
  "Drain excess water from paddy bunds",
  "Store harvested produce in dry shade",
];

const crops = [
  {
    name: "Cotton",
    acres: "2.5 Acres",
    emoji: "🌾",
    status: "Action Needed",
    statusClass: "bg-orange-100 text-orange-700",
    bg: "bg-orange-50/70",
    border: "border-orange-200",
    items: [
      {
        icon: CloudRain,
        title: "Heavy Rain Tomorrow",
        text: "Waterlogging risk — ensure drainage channels are clear.",
        color: "text-blue-500",
      },
      {
        icon: Bug,
        title: "Bollworm Risk",
        text: "Humid conditions increase pest pressure. Inspect today.",
        color: "text-red-500",
      },
      {
        icon: Sun,
        title: "Today Sunny",
        text: "Good for boll development. Apply pesticide before 10 AM.",
        color: "text-yellow-500",
      },
    ],
    action: "Clear drainage. Apply pesticide today before rain.",
  },

  {
    name: "Tomato",
    acres: "1.2 Acres",
    emoji: "🍅",
    status: "High Risk",
    statusClass: "bg-red-100 text-red-600",
    bg: "bg-red-50/70",
    border: "border-red-200",
    items: [
      {
        icon: CloudRain,
        title: "Rain + Humidity",
        text: "High early blight risk. Apply Mancozeb before rain arrives.",
        color: "text-blue-500",
      },
      {
        icon: Thermometer,
        title: "Heat (34°C)",
        text: "Stress on fruit setting. Irrigate in the morning.",
        color: "text-red-500",
      },
      {
        icon: TrendingUp,
        title: "Price Rising",
        text: "Good time to harvest and sell. Nashik price ₹1,960/Q.",
        color: "text-green-600",
      },
    ],
    action: "Spray fungicide today. Harvest ripe fruit before rain.",
  },

  {
    name: "Wheat",
    acres: "1.7 Acres",
    emoji: "🌽",
    status: "All Good",
    statusClass: "bg-green-100 text-green-700",
    bg: "bg-green-50/70",
    border: "border-green-200",
    items: [
      {
        icon: CloudRain,
        title: "Rain Tomorrow",
        text: "Timely rain is beneficial for grain filling stage.",
        color: "text-blue-500",
      },
      {
        icon: Thermometer,
        title: "Heatwave Next Week",
        text: "Temp >40°C may affect grain quality. Monitor closely.",
        color: "text-orange-500",
      },
      {
        icon: Droplets,
        title: "Skip Irrigation",
        text: "Rain expected — save water and skip today's irrigation.",
        color: "text-green-600",
      },
    ],
    action: "Skip irrigation. Rain will be sufficient. Watch heat next week.",
  },

  {
    name: "Onion",
    acres: "0.8 Acres",
    emoji: "🧅",
    status: "Monitor",
    statusClass: "bg-yellow-100 text-yellow-700",
    bg: "bg-yellow-50/70",
    border: "border-yellow-200",
    items: [
      {
        icon: CloudRain,
        title: "Heavy Rain Risk",
        text: "Excess moisture can cause bulb rot. Ensure field drainage.",
        color: "text-blue-500",
      },
      {
        icon: Eye,
        title: "Purple Blotch Risk",
        text: "High humidity favors fungal disease. Spray Iprodione.",
        color: "text-orange-500",
      },
      {
        icon: TrendingDown,
        title: "Price Declining",
        text: "Hold stock 5–7 days. Prices likely to recover.",
        color: "text-red-500",
      },
    ],
    action: "Improve drainage. Spray fungicide. Hold stock for now.",
  },
];

const hourly = [
  { time: "6 AM", temp: "26°", icon: Sun },
  { time: "8 AM", temp: "29°", icon: Sun },
  { time: "10 AM", temp: "32°", rain: "5%", icon: Sun },
  { time: "12 PM", temp: "34°", icon: Sun },
  { time: "2 PM", temp: "35°", icon: Sun },
  { time: "4 PM", temp: "34°", icon: Sun },
  { time: "6 PM", temp: "31°", rain: "10%", icon: Sun },
  { time: "8 PM", temp: "28°", rain: "40%", icon: CloudRain },
  { time: "10 PM", temp: "26°", rain: "65%", icon: CloudRain },
];

export default function WeatherPage() {
  return (
    <Layout title="Weather">
      <div className="space-y-7">

        {/* PAGE TITLE */}
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#202820]">
            Weather Intelligence
          </h1>
        </div>

        {/* CURRENT WEATHER + 7 DAY FORECAST */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[395px_1fr]">

          {/* CURRENT WEATHER */}
          <div className="relative overflow-hidden rounded-[24px] bg-[#2d7054] p-7 text-white">

            <div className="absolute -right-8 -top-12 h-48 w-48 rounded-full bg-[#438064] opacity-70" />

            <p className="relative text-sm font-semibold text-white/70">
              Right Now · Nashik
            </p>

            <div className="relative mt-3 flex items-center gap-5">
              <Sun size={55} strokeWidth={2.5} className="text-yellow-300" />

              <div>
                <div className="text-5xl font-bold">34°</div>
                <p className="text-sm text-white/70">Partly Sunny</p>
              </div>
            </div>

            <div className="relative mt-7 grid grid-cols-2 gap-3">

              <div className="rounded-2xl bg-white/10 p-3">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Droplets size={16} />
                  Humidity
                </div>
                <p className="mt-1 text-lg font-bold">68%</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Wind size={16} />
                  Wind
                </div>
                <p className="mt-1 text-lg font-bold">12 km/h</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Thermometer size={16} />
                  Feels Like
                </div>
                <p className="mt-1 text-lg font-bold">37°C</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Sun size={16} />
                  UV Index
                </div>
                <p className="mt-1 text-lg font-bold">High</p>
              </div>

            </div>
          </div>

          {/* FORECAST */}
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
                        item.active ? "text-white" : "text-gray-500"
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

                    <p className="font-bold">{item.high}</p>

                    <p
                      className={`mt-1 text-sm ${
                        item.active ? "text-white/60" : "text-gray-500"
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

                {[0, 30, 45, 25, 5, 0, 0].map((height, index) => (
                  <div
                    key={index}
                    className="flex flex-1 items-end justify-center"
                  >
                    <div
                      className="w-7 rounded-t-md bg-blue-400"
                      style={{ height: `${height + 4}px` }}
                    />
                  </div>
                ))}

              </div>

              <div className="mt-1 flex justify-between px-5 text-[11px] text-gray-500">
                <span>Today</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

            </div>
          </div>
        </div>

        {/* RISK ALERTS */}
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

                    <Icon size={23} className={risk.iconColor} />

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

        {/* ACTION PLAN */}
        <section className="rounded-[24px] bg-[#d9f3dd] p-6">

          <div className="flex items-center gap-2">
            <Zap size={22} className="text-[#2d7054]" />

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
                      completed ? "text-green-600" : "text-gray-300"
                    }
                  />

                  <span
                    className={`text-sm font-semibold text-[#303830] ${
                      completed ? "line-through text-gray-400" : ""
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

        {/* CROP IMPACT */}
        <section>

          <h2 className="font-serif text-2xl font-bold text-[#202820]">
            How Today's Weather Affects Your Crops
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Based on current conditions: Sunny 34°C · Heavy rain tomorrow ·
            Humidity 68%
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-4">

            {crops.map((crop) => (
              <div
                key={crop.name}
                className={`rounded-[22px] border p-4 ${crop.bg} ${crop.border}`}
              >

                <div className="flex items-start justify-between gap-2">

                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{crop.emoji}</span>

                    <div>
                      <h3 className="font-bold text-lg text-[#202820]">
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

                <div className="mt-3 rounded-2xl bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    Your Action
                  </p>

                  <p className="mt-1 text-sm font-semibold leading-5 text-[#303830]">
                    {crop.action}
                  </p>
                </div>

              </div>
            ))}

          </div>
        </section>

        {/* HOURLY FORECAST */}
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
                  className="min-w-[72px] rounded-2xl bg-[#eae7df] px-3 py-3 text-center"
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