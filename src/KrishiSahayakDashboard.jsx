import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

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
  LogOut,
} from "lucide-react";

import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";
import { translateTexts } from "./services/translation";
import { logout } from "./services/auth";


// ---------------------------------------------------------
// NAVIGATION
// ---------------------------------------------------------

const NAV_ITEMS = [
  { key: "home", icon: Home, path: "/dashboard" },
  { key: "aiCopilot", icon: Mic, path: "/ai-copilot" },
  { key: "weather", icon: CloudSun, path: "/weather" },
  { key: "cropScanner", icon: Camera, path: "/crop-scanner" },
  { key: "mandiMarket", icon: TrendingUp, path: "/mandi-market" },
  { key: "farmDashboard", icon: BarChart3, path: "/farm-dashboard" },
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
// ALERT DATA
// ---------------------------------------------------------

const ALERTS = [
  {
    emoji: "⚠️🐛",
    key: "pestOutbreak",
    descriptionKey: "pestDescription",
    badge: "urgent",
    linkKey: "getAdvice",
    theme: "red",
  },
  {
    emoji: "🌧️",
    key: "rainTomorrow",
    descriptionKey: "rainDescription",
    linkKey: "viewWeather",
    theme: "blue",
  },
  {
    emoji: "📈",
    key: "tomatoPrices",
    descriptionKey: "tomatoDescription",
    linkKey: "seePrices",
    theme: "green",
  },
  {
    emoji: "🌡️",
    key: "heatwave",
    descriptionKey: "heatwaveDescription",
    linkKey: "viewWeather",
    theme: "orange",
  },
];


// ---------------------------------------------------------
// STATS
// ---------------------------------------------------------

const STATS = [
  {
    icon: Wheat,
    value: "58 Q",
    labelKey: "yieldEstimate",
    subKey: "yieldSub",
    theme: "green",
  },
  {
    icon: TrendingUp,
    value: "₹1.1L",
    labelKey: "expectedProfit",
    subKey: "expectedProfitSub",
    theme: "green",
  },
  {
    icon: Activity,
    value: "82/100",
    labelKey: "farmHealth",
    subKey: "farmHealthSub",
    theme: "blue",
  },
  {
    icon: Bell,
    value: "3 New",
    labelKey: "alertsToday",
    subKey: "alertsTodaySub",
    theme: "red",
  },
];


// ---------------------------------------------------------
// COLORS / THEMES
// ---------------------------------------------------------

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


// ---------------------------------------------------------
// ENGLISH SOURCE TEXT
// These are sent to MyMemory for translation.
// There are NO hardcoded Hindi/Marathi/etc translations.
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
    name: "Ramesh Patil",
    farm: "Nashik · Cotton, Wheat",
  },

  topbar: {
    home: "Home",
    smartAlerts: "Smart Alerts",
  },

  hero: {
    goodMorning: "Good Morning",
    greeting: "Namaste, Ramesh ji!",
    farmDoingWell:
      "Your farm is doing well. Rain expected tomorrow — check your action plan.",
    weather: "Nashik · Partly Sunny",
    talkToAI: "Talk to AI",
    scanCrop: "Scan Crop",
  },

  alerts: {
    heading: "Today's Alerts",
    viewAll: "View All",

    pestOutbreak: "Pest Outbreak!",
    urgent: "Urgent",
    pestDescription:
      "High bollworm risk — inspect cotton today.",
    getAdvice: "Get Advice",

    rainTomorrow: "Rain Tomorrow",
    rainDescription:
      "Skip irrigation today. Drain paddy fields.",
    viewWeather: "View Weather",

    tomatoPrices: "Tomato Prices Up",
    tomatoDescription:
      "₹1,960/Q at Nashik — good time to sell.",
    seePrices: "See Prices",

    heatwave: "Heatwave Next Week",
    heatwaveDescription:
      "Temp >40°C on Tuesday. Increase irrigation.",
  },

  actionPlan: {
    title: "Today's AI Action Plan",
    description:
      "Rain forecast for tomorrow. Apply fungicide today before 10 AM to protect wheat from blight. Skip irrigation. Check cotton field for bollworm signs — pest risk is elevated this week.",
    askAI: "Ask AI for Details",
  },

  stats: {
    yieldEstimate: "Yield Estimate",
    yieldSub: "+8% vs last season",

    expectedProfit: "Expected Profit",
    expectedProfitSub: "This season",

    farmHealth: "Farm Health",
    farmHealthSub: "Good condition",

    alertsToday: "Alerts Today",
    alertsTodaySub: "Tap to review",
  },
};


// ---------------------------------------------------------
// Flatten nested object for API translation
// ---------------------------------------------------------

function flattenTexts(obj, prefix = "", result = {}) {
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix
      ? `${prefix}.${key}`
      : key;

    if (
      typeof value === "object" &&
      value !== null
    ) {
      flattenTexts(value, fullKey, result);
    } else {
      result[fullKey] = value;
    }
  });

  return result;
}


// ---------------------------------------------------------
// Rebuild nested object after translation
// ---------------------------------------------------------

function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let current = obj;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      if (!current[key]) {
        current[key] = {};
      }

      current = current[key];
    }
  });
}


function buildTranslatedObject(
  flatKeys,
  translatedValues
) {
  const result = {};

  flatKeys.forEach((key, index) => {
    setNestedValue(
      result,
      key,
      translatedValues[index]
    );
  });

  return result;
}


// ---------------------------------------------------------
// SIDEBAR
// ---------------------------------------------------------

function Sidebar({ t, language }) {
  const { farmerData } = useAuth();

  const profile = farmerData?.profile;
  const farm = farmerData?.farm;
  const crops = Array.isArray(farmerData?.crops)
    ? farmerData.crops
    : [];

  const farmerName =
    profile?.name ||
    profile?.full_name ||
    t.user.name ||
    "Farmer";

  const farmLocation =
    [profile?.district, profile?.state]
      .filter(Boolean)
      .join(" · ") ||
    farm?.district ||
    farm?.state ||
    t.user.farm;

  const cropNames = crops
    .map((crop) => crop?.crop_name || crop?.name)
    .filter(Boolean)
    .join(", ");

  const initials = farmerName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

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
        {NAV_ITEMS.map(({ key, icon: Icon, path, badge }) => (
          <NavLink
            key={key}
            to={path}
            className={({ isActive }) =>
              `flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#214d34] text-white shadow-sm"
                  : "text-slate-600 hover:bg-[#f4f1e7]"
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Icon size={18} />

              {key === "weather" &&
              (language === "hi" || language === "hi-IN")
                ? "मौसम"
                : t.nav[key]}
            </span>

            {badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="m-3 flex items-center gap-3 rounded-xl bg-[#f4f1e7] p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d8c29b] text-sm font-semibold text-[#5a4423]">
          {initials || "F"}
        </div>

        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-[#24352a]">
            {farmerName}
          </p>

          <p className="truncate text-xs text-slate-500">
            {farmLocation}

            {cropNames && (
              <>
                {" · "}
                {cropNames}
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

function TopBar({ t }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-[#e5dfd2] bg-white px-4 py-3 md:px-6">
      <h1 className="font-serif text-xl font-bold text-[#24352a]">
        {t.topbar.home}
      </h1>

      <div className="flex items-center gap-4">
        {/* Smart Alerts */}
        <button
          type="button"
          onClick={() => navigate("/alerts")}
          className="relative text-slate-500 hover:text-slate-700"
          aria-label={t.topbar.smartAlerts}
          title={t.topbar.smartAlerts}
        >
          <Bell size={20} />

          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Profile */}
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5f0df] text-[#1f5b3d]"
          aria-label={t.nav.profile}
          title={t.nav.profile}
        >
          <User size={16} />
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}

// ---------------------------------------------------------
// HERO BANNER
// ---------------------------------------------------------

function HeroBanner({ t, language }) {
  const navigate = useNavigate();

  const FARM_HERO_URL =
    "https://i.pinimg.com/736x/38/ef/ad/38efadb7ab46f87f0353e4f449412e27.jpg";

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

            {/* ONLY GREETING */}
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              {language === "hi" || language === "hi-IN"
                ? "सुप्रभात"
                : t.hero.goodMorning}
              <span>☀️</span>
            </p>

            {/* PERSONAL GREETING */}
            <h2 className="mt-4 font-serif text-2xl font-bold sm:text-3xl">
              {t.hero.greeting}
            </h2>

            <p className="mt-5 text-sm font-semibold text-white">
              {t.hero.farmDoingWell}
            </p>

          </div>

          {/* Weather */}
          <div className="hidden shrink-0 rounded-xl bg-white/15 p-10 text-white backdrop-blur-sm sm:block">
            <p className="text-3xl font-bold">
              34°C
            </p>

            <p className="text-base text-white/90">
              {t.hero.weather}
            </p>

            <div className="mt-3 flex gap-7 text-sm">
              <span className="flex items-center gap-1">
                <Droplets size={12} />
                68%
              </span>

              <span className="flex items-center gap-1">
                <Wind size={12} />
                12 km/h
              </span>
            </div>
          </div>

        </div>

        {/* Hero buttons */}
        <div className="flex flex-wrap gap-7">

          <button
            onClick={() => navigate("/ai-copilot")}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-1.5 text-sm font-semibold text-[#1f5b3d] shadow-sm hover:bg-[#e5f0df]"
          >
            <Mic size={16} />
            {t.hero.talkToAI}
          </button>

          <button
            onClick={() => navigate("/crop-scanner")}
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
  emoji,
  title,
  badge,
  description,
  linkText,
  theme,
}) {
  const themeStyles =
    ALERT_THEMES[theme];

  return (
    <div
      className={`rounded-xl border-2 p-5 ${themeStyles.card}`}
    >

      <div className="flex items-start justify-between gap-2">

        <p className="flex items-center gap-2 text-[15px] font-bold text-[#24352a]">
          <span>{emoji}</span>
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
        className={`mt-2 flex items-center gap-1 text-sm font-bold ${themeStyles.link}`}
      >
        {linkText}
        <ChevronRight size={14} />
      </button>

    </div>
  );
}


// ---------------------------------------------------------
// ACTION PLAN
// ---------------------------------------------------------

function ActionPlanBanner({ t }) {
  const navigate = useNavigate();

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
        {t.actionPlan.description}
      </p>

      <button
        onClick={() =>
          navigate("/ai-copilot")
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


// ---------------------------------------------------------
// MAIN DASHBOARD
// ---------------------------------------------------------

export default function KrishiShayakDashboard() {

  const { language } = useLanguage();

  const [translated, setTranslated] =
    useState(ENGLISH_TEXTS);

  const [translationLoading, setTranslationLoading] =
    useState(false);


  // -------------------------------------------------------
  // Translate dashboard whenever language changes
  // -------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function translateDashboard() {

      // English = no API call needed
      if (language === "en") {
        setTranslated(ENGLISH_TEXTS);
        setTranslationLoading(false);
        return;
      }

      try {
        setTranslationLoading(true);

        const flatTexts =
          flattenTexts(ENGLISH_TEXTS);

        const keys =
          Object.keys(flatTexts);

        const sourceTexts =
          Object.values(flatTexts);

        console.log(
          "🌐 Translating dashboard to:",
          language
        );

        const translatedValues =
          await translateTexts(
            sourceTexts,
            language
          );

        if (cancelled) return;

        const translatedObject =
          buildTranslatedObject(
            keys,
            translatedValues
          );

        setTranslated(
          translatedObject
        );

      } catch (error) {

        console.error(
          "Dashboard translation failed:",
          error
        );

        // If API fails, keep English UI
        setTranslated(ENGLISH_TEXTS);

      } finally {

        if (!cancelled) {
          setTranslationLoading(false);
        }

      }
    }

    translateDashboard();

    return () => {
      cancelled = true;
    };

  }, [language]);


  // -------------------------------------------------------
  // Use English while translation is loading
  // -------------------------------------------------------

  const t =
    translationLoading
      ? ENGLISH_TEXTS
      : translated;


  return (
    <div className="flex h-screen w-full bg-[#faf7ef] font-sans text-[#24352a]">

      <Sidebar t={t} language={language} />

      <div className="flex flex-1 flex-col overflow-hidden">

        <TopBar t={t} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">

          <div className="mx-auto max-w-5xl space-y-6">

            {/* Hero */}

            <HeroBanner t={t} language={language} />


            {/* Alerts */}

            <div>

              <div className="mb-3 flex items-center justify-between">

                <h3 className="font-serif text-lg font-semibold text-[#24352a]">
                  {t.alerts.heading}
                </h3>

                <button className="flex items-center gap-1 text-sm font-medium text-[#1f5b3d] hover:text-[#173b27]">
                  {t.alerts.viewAll}
                  <ChevronRight size={14} />
                </button>

              </div>


              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                {ALERTS.map((alert) => (

                  <AlertCard
                    key={alert.key}
                    emoji={alert.emoji}
                    title={
                      t.alerts[alert.key]
                    }
                    badge={
                      alert.badge
                        ? t.alerts[
                            alert.badge
                          ]
                        : null
                    }
                    description={
                      t.alerts[
                        alert.descriptionKey
                      ]
                    }
                    linkText={
                      t.alerts[
                        alert.linkKey
                      ]
                    }
                    theme={alert.theme}
                  />

                ))}

              </div>

            </div>


            {/* AI Action Plan */}

            <ActionPlanBanner t={t} />


            {/* Stats */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {STATS.map((stat) => (

                <StatCard
                  key={stat.labelKey}
                  icon={stat.icon}
                  value={stat.value}
                  label={
                    t.stats[
                      stat.labelKey
                    ]
                  }
                  sub={
                    t.stats[
                      stat.subKey
                    ]
                  }
                  theme={stat.theme}
                />

              ))}

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}