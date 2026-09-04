import React, { useEffect, useMemo, useState } from "react";

import {
  Bell,
  CloudRain,
  Bug,
  TrendingUp,
  AlertTriangle,
  Mic,
  CheckCircle2,
} from "lucide-react";

import Layout from "./Layout.jsx";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";
import { translateTexts } from "./services/translation";

// ============================================================
// CATEGORY ICONS
// ============================================================

const CATEGORY_ICON = {
  weather: CloudRain,
  pest_disease: Bug,
  market: TrendingUp,
  yield_risk: AlertTriangle,
  system: Bell,
};

// ============================================================
// STATIC UI TEXT
// These are sent to MyMemory when the selected language changes.
// ============================================================

const UI_TEXT = [
  "Weather",
  "Pest & Disease",
  "Market Price",
  "Yield Risk",
  "System",

  "High",
  "Medium",
  "Low",

  "Just now",
  "min",
  "mins",
  "hour",
  "hours",
  "day",
  "days",

  "Ask AI",
  "Mark Read",

  "Smart Alerts",
  "Smart Alert Center",
  "unread alerts",
  "Mark All Read",

  "Loading alerts…",

  "No alerts yet — you'll see weather, pest, market, and yield alerts here once they start coming in.",

  "Smart Alerts — Action Required",
  "Unread",
  "Notifications",
];

// ============================================================
// LANGUAGE CODE HELPERS
// MyMemory supports these language codes.
// ============================================================

const SUPPORTED_LANGUAGES = {
  en: "en",
  hi: "hi",
  mr: "mr",
  bn: "bn",
  ta: "ta",
  te: "te",
  kn: "kn",
  ml: "ml",
  gu: "gu",
  pa: "pa",
  or: "or",
};

// ============================================================
// CATEGORY LABEL
// ============================================================

function getCategoryLabel(category) {
  if (category === "weather") return "Weather";
  if (category === "pest_disease") return "Pest & Disease";
  if (category === "market") return "Market Price";
  if (category === "yield_risk") return "Yield Risk";
  if (category === "system") return "System";

  return "System";
}

// ============================================================
// WEATHER / PEST = ACTION
// MARKET / YIELD / SYSTEM = NOTIFICATION
// ============================================================

function sectionForCategory(category) {
  return category === "weather" || category === "pest_disease"
    ? "action"
    : "notification";
}

// ============================================================
// SEVERITY
// ============================================================

function severityLabel(severity) {
  if (severity === "urgent") return "High";
  if (severity === "warn") return "Medium";

  return "Low";
}

function severityClass(severity) {
  const label = severityLabel(severity);

  if (label === "High") {
    return "bg-red-100 text-red-700";
  }

  if (label === "Medium") {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-slate-100 text-slate-500";
}

// ============================================================
// RELATIVE TIME
// ============================================================

function getRelativeTimeKey(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();

  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) {
    return {
      type: "justNow",
      value: 0,
    };
  }

  if (mins < 60) {
    return {
      type: "minutes",
      value: mins,
    };
  }

  const hours = Math.floor(mins / 60);

  if (hours < 24) {
    return {
      type: "hours",
      value: hours,
    };
  }

  const days = Math.floor(hours / 24);

  return {
    type: "days",
    value: days,
  };
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SmartAlertsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------
  // Translation state
  // ----------------------------------------------------------

  const [translations, setTranslations] = useState({});

  const targetLanguage =
    SUPPORTED_LANGUAGES[language] || "en";

  // ----------------------------------------------------------
  // Translate static UI whenever language changes
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadTranslations() {
      if (targetLanguage === "en") {
        const englishTranslations = {};

        UI_TEXT.forEach((text) => {
          englishTranslations[text] = text;
        });

        if (!cancelled) {
          setTranslations(englishTranslations);
        }

        return;
      }

      try {
        const translated = await translateTexts(
          UI_TEXT,
          targetLanguage,
          "en"
        );

        if (cancelled) return;

        const mapped = {};

        UI_TEXT.forEach((text, index) => {
          mapped[text] = translated[index] || text;
        });

        setTranslations(mapped);
      } catch (error) {
        console.error(
          "Smart Alerts translation failed:",
          error
        );

        if (!cancelled) {
          const fallback = {};

          UI_TEXT.forEach((text) => {
            fallback[text] = text;
          });

          setTranslations(fallback);
        }
      }
    }

    loadTranslations();

    return () => {
      cancelled = true;
    };
  }, [targetLanguage]);

  // ----------------------------------------------------------
  // Translation helper
  // ----------------------------------------------------------

  function t(text) {
    return translations[text] || text;
  }

  // ----------------------------------------------------------
  // Translate notification text
  // ----------------------------------------------------------

  const [translatedAlerts, setTranslatedAlerts] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function translateNotifications() {
      if (!alerts.length) {
        setTranslatedAlerts({});
        return;
      }

      if (targetLanguage === "en") {
        const english = {};

        alerts.forEach((alert) => {
          english[alert.id] = {
            title: alert.title || "",
            body: alert.body || "",
          };
        });

        if (!cancelled) {
          setTranslatedAlerts(english);
        }

        return;
      }

      try {
        const textsToTranslate = [];

        alerts.forEach((alert) => {
          textsToTranslate.push(alert.title || "");
          textsToTranslate.push(alert.body || "");
        });

        const translated = await translateTexts(
          textsToTranslate,
          targetLanguage,
          "en"
        );

        if (cancelled) return;

        const mapped = {};

        alerts.forEach((alert, index) => {
          mapped[alert.id] = {
            title:
              translated[index * 2] ||
              alert.title ||
              "",

            body:
              translated[index * 2 + 1] ||
              alert.body ||
              "",
          };
        });

        setTranslatedAlerts(mapped);
      } catch (error) {
        console.error(
          "Notification translation failed:",
          error
        );

        if (!cancelled) {
          const fallback = {};

          alerts.forEach((alert) => {
            fallback[alert.id] = {
              title: alert.title || "",
              body: alert.body || "",
            };
          });

          setTranslatedAlerts(fallback);
        }
      }
    }

    translateNotifications();

    return () => {
      cancelled = true;
    };
  }, [alerts, targetLanguage]);

  // ----------------------------------------------------------
  // Load notifications from Supabase
  // ----------------------------------------------------------

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAlerts() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(50);

      if (!cancelled) {
        if (error) {
          console.error(
            "Failed to load notifications:",
            error
          );
        } else {
          setAlerts(data ?? []);
        }

        setLoading(false);
      }
    }

    loadAlerts();

    // --------------------------------------------------------
    // Realtime notification updates
    // --------------------------------------------------------

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setAlerts((prev) => [
            payload.new,
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;

      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ----------------------------------------------------------
  // Mark single notification as read
  // ----------------------------------------------------------

  async function markAsRead(id) {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              is_read: true,
            }
          : alert
      )
    );

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", id);

    if (error) {
      console.error(
        "Failed to mark alert read:",
        error
      );
    }
  }

  // ----------------------------------------------------------
  // Mark all notifications as read
  // ----------------------------------------------------------

  async function markAllAsRead() {
    const unreadIds = alerts
      .filter((alert) => !alert.is_read)
      .map((alert) => alert.id);

    if (unreadIds.length === 0) return;

    setAlerts((prev) =>
      prev.map((alert) => ({
        ...alert,
        is_read: true,
      }))
    );

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .in("id", unreadIds);

    if (error) {
      console.error(
        "Failed to mark all read:",
        error
      );
    }
  }

  // ----------------------------------------------------------
  // Counts
  // ----------------------------------------------------------

  const unreadCount = useMemo(() => {
    return alerts.filter(
      (alert) => !alert.is_read
    ).length;
  }, [alerts]);

  const actionAlerts = useMemo(() => {
    return alerts.filter(
      (alert) =>
        sectionForCategory(alert.category) ===
        "action"
    );
  }, [alerts]);

  const notificationAlerts = useMemo(() => {
    return alerts.filter(
      (alert) =>
        sectionForCategory(alert.category) ===
        "notification"
    );
  }, [alerts]);

  const categoryCounts = useMemo(() => {
    const counts = {
      weather: 0,
      pest_disease: 0,
      market: 0,
      yield_risk: 0,
    };

    for (const alert of alerts) {
      if (
        counts[alert.category] !== undefined
      ) {
        counts[alert.category]++;
      }
    }

    return counts;
  }, [alerts]);

  // ----------------------------------------------------------
  // Render relative time
  // ----------------------------------------------------------

  function renderRelativeTime(isoString) {
    const time = getRelativeTimeKey(isoString);

    if (time.type === "justNow") {
      return t("Just now");
    }

    if (time.type === "minutes") {
      const unit =
        time.value === 1
          ? t("min")
          : t("mins");

      return `${time.value} ${unit} ago`;
    }

    if (time.type === "hours") {
      const unit =
        time.value === 1
          ? t("hour")
          : t("hours");

      return `${time.value} ${unit} ago`;
    }

    const unit =
      time.value === 1
        ? t("day")
        : t("days");

    return `${time.value} ${unit} ago`;
  }

  // ----------------------------------------------------------
  // Render individual alert
  // ----------------------------------------------------------

  function renderAlertCard(alertRow) {
    const Icon =
      CATEGORY_ICON[alertRow.category] ||
      Bell;

    const isRead = alertRow.is_read;

    const isAction =
      sectionForCategory(
        alertRow.category
      ) === "action";

    const translated =
      translatedAlerts[alertRow.id];

    const title =
      translated?.title ||
      alertRow.title ||
      "";

    const body =
      translated?.body ||
      alertRow.body ||
      "";

    return (
      <div
        key={alertRow.id}
        className={`rounded-2xl border p-5 transition ${
          isRead
            ? "border-[#dfe5df] bg-[#f7f7f3]"
            : isAction
            ? "border-red-300 bg-[#fff3f3]"
            : "border-green-200 bg-[#f3fff6]"
        }`}
      >
        <div className="flex gap-4">
          {/* Icon */}
          <div className="shrink-0 pt-0.5">
            <Icon
              size={22}
              className={
                isRead
                  ? "text-slate-400"
                  : isAction
                  ? "text-red-500"
                  : "text-green-500"
              }
            />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <h4
                className={`text-lg font-bold ${
                  isRead
                    ? "text-slate-500"
                    : isAction
                    ? "text-red-600"
                    : "text-[#24352a]"
                }`}
              >
                {title}
              </h4>

              <span className="shrink-0 text-sm text-slate-500">
                {renderRelativeTime(
                  alertRow.created_at
                )}
              </span>
            </div>

            {/* Notification body */}
            <p
              className={`mt-2 text-base leading-6 ${
                isRead
                  ? "text-slate-400"
                  : "text-slate-600"
              }`}
            >
              {body}
            </p>

            {/* Buttons */}
            <div className="mt-4 flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-sm font-semibold text-[#2d7355] hover:text-[#1f5b3d]">
                <Mic size={15} />

                {t("Ask AI")}
              </button>

              {!isRead && (
                <button
                  onClick={() =>
                    markAsRead(
                      alertRow.id
                    )
                  }
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  {t("Mark Read")}
                </button>
              )}
            </div>
          </div>

          {/* Severity */}
          <div className="hidden shrink-0 sm:block">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${severityClass(
                alertRow.severity
              )}`}
            >
              {t(
                severityLabel(
                  alertRow.severity
                )
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <Layout title={t("Smart Alerts")}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {/* Heading */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#20291f]">
            {t("Smart Alert Center")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {unreadCount} {t("unread alerts")}
          </p>
        </div>

        {/* Mark all read */}
        <button
          onClick={markAllAsRead}
          className="flex w-fit items-center gap-2 rounded-full bg-[#d9f4df] px-4 py-2 text-sm font-semibold text-[#2d7355] transition hover:bg-[#c9ebd1]"
        >
          <CheckCircle2 size={17} />

          {t("Mark All Read")}
        </button>
      </div>

      {/* ======================================================
          CATEGORY CARDS
      ====================================================== */}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Weather */}
        <div className="rounded-2xl bg-[#eef5ff] p-5">
          <div className="flex items-center gap-3">
            <CloudRain
              size={22}
              className="text-blue-500"
            />

            <div>
              <p className="text-2xl font-bold text-[#24352a]">
                {categoryCounts.weather}
              </p>

              <p className="text-sm text-slate-500">
                {t("Weather")}
              </p>
            </div>
          </div>
        </div>

        {/* Pest */}
        <div className="rounded-2xl bg-[#fff0f1] p-5">
          <div className="flex items-center gap-3">
            <Bug
              size={22}
              className="text-red-500"
            />

            <div>
              <p className="text-2xl font-bold text-[#24352a]">
                {categoryCounts.pest_disease}
              </p>

              <p className="text-sm text-slate-500">
                {t("Pest & Disease")}
              </p>
            </div>
          </div>
        </div>

        {/* Market */}
        <div className="rounded-2xl bg-[#effbf3] p-5">
          <div className="flex items-center gap-3">
            <TrendingUp
              size={22}
              className="text-green-500"
            />

            <div>
              <p className="text-2xl font-bold text-[#24352a]">
                {categoryCounts.market}
              </p>

              <p className="text-sm text-slate-500">
                {t("Market Price")}
              </p>
            </div>
          </div>
        </div>

        {/* Yield */}
        <div className="rounded-2xl bg-[#fff7ec] p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle
              size={22}
              className="text-orange-500"
            />

            <div>
              <p className="text-2xl font-bold text-[#24352a]">
                {categoryCounts.yield_risk}
              </p>

              <p className="text-sm text-slate-500">
                {t("Yield Risk")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <p className="mt-6 text-sm text-slate-500">
          {t("Loading alerts…")}
        </p>
      )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {!loading &&
        alerts.length === 0 && (
          <p className="mt-6 text-sm text-slate-500">
            {t(
              "No alerts yet — you'll see weather, pest, market, and yield alerts here once they start coming in."
            )}
          </p>
        )}

      {/* ======================================================
          ACTION ALERTS
      ====================================================== */}

      {actionAlerts.length > 0 && (
        <section className="mt-7">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-red-400" />

            <h3 className="text-lg font-bold text-red-600">
              {t(
                "Smart Alerts — Action Required"
              )}
            </h3>

            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
              {
                actionAlerts.filter(
                  (alert) => !alert.is_read
                ).length
              }{" "}
              {t("Unread")}
            </span>
          </div>

          <div className="space-y-3">
            {actionAlerts.map(
              renderAlertCard
            )}
          </div>
        </section>
      )}

      {/* ======================================================
          NOTIFICATIONS
      ====================================================== */}

      {notificationAlerts.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-blue-400" />

            <h3 className="text-lg font-bold text-[#24352a]">
              {t("Notifications")}
            </h3>

            <span className="rounded-full bg-[#e9e7df] px-2.5 py-1 text-xs font-bold text-slate-500">
              {
                notificationAlerts.filter(
                  (alert) => !alert.is_read
                ).length
              }{" "}
              {t("Unread")}
            </span>
          </div>

          <div className="space-y-3">
            {notificationAlerts.map(
              renderAlertCard
            )}
          </div>
        </section>
      )}
    </Layout>
  );
}