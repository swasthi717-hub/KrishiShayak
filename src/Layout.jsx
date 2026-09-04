import React, { useEffect, useState } from "react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import {
  Home,
  Mic,
  CloudSun,
  Camera,
  TrendingUp,
  BarChart3,
  Bell,
  User,
  Wheat,
  HelpCircle,
  WifiOff,
  RefreshCw,
  LogOut,
} from "lucide-react";

import { getCurrentUser, logout } from "./services/auth";

import {
  requestAndSaveFCMToken,
  listenForForegroundMessages,
} from "./firebase";

import { useOfflineSync } from "./hooks/useOfflineSync";

import { useLanguage } from "./context/LanguageContext";

import { translateTexts } from "./services/translation";

// ============================================================
// NAVIGATION
// ============================================================

const NAV_ITEMS = [
  {
    key: "home",
    label: "Home",
    icon: Home,
    path: "/dashboard",
  },
  {
    key: "aiCopilot",
    label: "AI Copilot",
    icon: Mic,
    path: "/ai-copilot",
  },
  {
    key: "weather",
    label: "Weather",
    icon: CloudSun,
    path: "/weather",
  },
  {
    key: "cropScanner",
    label: "Crop Scanner",
    icon: Camera,
    path: "/crop-scanner",
  },
  {
    key: "mandiMarket",
    label: "Mandi Market",
    icon: TrendingUp,
    path: "/mandi-market",
  },
  {
    key: "farmDashboard",
    label: "Farm Dashboard",
    icon: BarChart3,
    path: "/farm-dashboard",
  },
  {
    key: "smartAlerts",
    label: "Smart Alerts",
    icon: Bell,
    path: "/alerts",
    badge: 3,
  },
  {
    key: "profile",
    label: "Profile",
    icon: User,
    path: "/profile",
  },
];

// ============================================================
// LAYOUT TEXT
// ============================================================

const LAYOUT_TEXTS = {
  home: "Home",
  aiCopilot: "AI Copilot",
  weather: "Weather",
  cropScanner: "Crop Scanner",
  mandiMarket: "Mandi Market",
  farmDashboard: "Farm Dashboard",
  smartAlerts: "Smart Alerts",
  profile: "Profile",

  // Used only for the same dynamic sidebar fallback as the Dashboard.
  userName: "Ramesh Patil",
  userFarm: "Nashik · Cotton, Wheat",

  aiFarmingCopilot: "AI Farming Copilot",

  offline: "Offline",
  waiting: "waiting",

  needReview: "need review",

  syncing: "Syncing",

  logout: "Logout",

  help: "Help",
};

// ============================================================
// SIDEBAR
// ============================================================

function Sidebar({ translations, language }) {
  const { farmerData } = useAuth();

  const profile = farmerData?.profile;
  const farm = farmerData?.farm;
  const crops = Array.isArray(farmerData?.crops)
    ? farmerData.crops
    : [];

  // Keep the same dynamic data logic used by the Dashboard sidebar.
  const userName = profile?.name || translations.userName;

  const farmDetails =
    farm?.district ||
    farm?.state ||
    translations.userFarm;

  const cropNames = crops
    .map((crop) => crop?.crop_name)
    .filter(Boolean)
    .join(", ");

  const farmerName = userName;

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
        <div className="h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden">
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
            {translations.aiFarmingCopilot}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(
          ({ key, icon: Icon, path, badge }) => (
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
                  : translations[key]}
              </span>

              {badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}
            </NavLink>
          )
        )}
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
            {farmDetails}

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

// ============================================================
// OFFLINE / SYNC STATUS BADGE
// ============================================================

function SyncStatusBadge({ translations }) {
  const {
    isOnline,
    pendingCount,
    conflicts,
    permanentFailures,
  } = useOfflineSync();

  if (
    isOnline &&
    pendingCount === 0 &&
    conflicts.length === 0 &&
    permanentFailures.length === 0
  ) {
    return null;
  }

  if (!isOnline) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        <WifiOff size={12} />

        {translations.offline}

        {pendingCount > 0
          ? ` · ${pendingCount} ${translations.waiting}`
          : ""}
      </span>
    );
  }

  if (
    conflicts.length > 0 ||
    permanentFailures.length > 0
  ) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        {conflicts.length + permanentFailures.length}{" "}
        {translations.needReview}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
      <RefreshCw size={12} className="animate-spin" />

      {translations.syncing} {pendingCount}
    </span>
  );
}

// ============================================================
// TOP BAR
// ============================================================

function TopBar({ title, translations }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-[#e5dfd2] bg-white px-4 py-3 md:px-6">
      {/* PAGE TITLE */}
      <h1 className="font-serif text-xl font-bold text-[#24352a]">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {/* OFFLINE / SYNC STATUS */}
        <SyncStatusBadge translations={translations} />

        {/* SMART ALERTS */}
        <button
          type="button"
          onClick={() => navigate("/alerts")}
          className="relative text-slate-500 hover:text-slate-700"
          aria-label={translations.smartAlerts}
          title={translations.smartAlerts}
        >
          <Bell size={20} />

          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* PROFILE */}
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5f0df] text-[#1f5b3d]"
          aria-label={translations.profile}
          title={translations.profile}
        >
          <User size={16} />
        </button>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
          aria-label={translations.logout}
          title={translations.logout}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

// ============================================================
// HELP BUTTON
// ============================================================

function HelpButton({ translations }) {
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#24352a] text-white shadow-lg hover:bg-[#1a271f]"
      aria-label={translations.help}
      title={translations.help}
    >
      <HelpCircle size={20} />
    </button>
  );
}

// ============================================================
// FOREGROUND ALERT TOAST
// ============================================================

function ForegroundAlertToast({ alert }) {
  if (!alert) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 w-80 rounded-xl border border-[#e5dfd2] bg-white p-4 shadow-lg">
      <p className="text-sm font-semibold text-[#24352a]">
        {alert.title}
      </p>

      {alert.body && (
        <p className="mt-1 text-xs text-slate-500">
          {alert.body}
        </p>
      )}
    </div>
  );
}

// ============================================================
// MAIN LAYOUT
// ============================================================

export default function Layout({ title, children }) {
  const [foregroundAlert, setForegroundAlert] =
    useState(null);

  const [translations, setTranslations] =
    useState(LAYOUT_TEXTS);

  const { language } = useLanguage();

  // ==========================================================
  // TRANSLATE LAYOUT
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadTranslations() {
      if (!language || language === "en") {
        setTranslations(LAYOUT_TEXTS);
        return;
      }

      try {
        const keys = Object.keys(LAYOUT_TEXTS);
        const englishTexts = Object.values(LAYOUT_TEXTS);

        const translated = await translateTexts(
          englishTexts,
          language,
          "en"
        );

        if (cancelled) {
          return;
        }

        const translatedObject = {};

        keys.forEach((key, index) => {
          translatedObject[key] =
            translated[index] || LAYOUT_TEXTS[key];
        });

        setTranslations(translatedObject);
      } catch (error) {
        console.error(
          "Layout translation error:",
          error
        );

        if (!cancelled) {
          setTranslations(LAYOUT_TEXTS);
        }
      }
    }

    loadTranslations();

    return () => {
      cancelled = true;
    };
  }, [language]);

  // ==========================================================
  // FIREBASE / FOREGROUND NOTIFICATIONS
  // ==========================================================

  useEffect(() => {
    let dismissTimer;

    (async () => {
      try {
        const user = await getCurrentUser();

        if (!user?.id) {
          return;
        }

        requestAndSaveFCMToken(user.id);

        listenForForegroundMessages(
          (notifTitle, notifBody) => {
            setForegroundAlert({
              title: notifTitle,
              body: notifBody,
            });

            clearTimeout(dismissTimer);

            dismissTimer = setTimeout(() => {
              setForegroundAlert(null);
            }, 6000);
          }
        );
      } catch (error) {
        console.error(
          "Notification setup failed:",
          error
        );
      }
    })();

    return () => {
      clearTimeout(dismissTimer);
    };
  }, []);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="flex h-screen w-full bg-[#faf7ef] font-sans text-[#24352a]">
      {/* SIDEBAR */}
      <Sidebar
        translations={translations}
        language={language}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* TOP BAR */}
        <TopBar
          title={title}
          translations={translations}
        />

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      {/* HELP */}
      <HelpButton translations={translations} />

      {/* FOREGROUND ALERT */}
      <ForegroundAlertToast alert={foregroundAlert} />
    </div>
  );
}
