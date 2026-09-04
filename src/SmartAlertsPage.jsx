import React, { useEffect, useMemo, useState } from "react";

import {
  Bell,
  CloudRain,
  Bug,
  TrendingUp,
  AlertTriangle,
  Mic,
  CheckCircle2,
  Plus,
  X,
  Trash2,
} from "lucide-react";

import Layout from "./Layout.jsx";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";
import { translateTexts } from "./services/translation";

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

// Rule creation is intentionally limited to weather + market for now —
// evaluate-alerts only knows how to fetch data for these two categories.
// pest_disease / yield_risk stay in the schema for later but aren't
// offered here so a user can't create a rule that will never fire.
const RULE_CATEGORY_OPTIONS = [
  { value: "weather", label: "Weather" },
  { value: "market", label: "Market Price (Mandi)" },
];

const METRIC_OPTIONS = {
  weather: [
    { value: "temperature_c", label: "Temperature (°C)" },
    { value: "rainfall_mm", label: "Rainfall (mm)" },
  ],
  market: [{ value: "price_per_quintal", label: "Price (₹/quintal)" }],
};

const OPERATOR_OPTIONS = [
  { value: ">", label: "> (greater than)" },
  { value: "<", label: "< (less than)" },
  { value: ">=", label: ">= (at least)" },
  { value: "<=", label: "<= (at most)" },
  { value: "=", label: "= (equals)" },
];

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

const EMPTY_FORM = {
  farm_id: "",
  category: "weather",
  crop_name: "",
  metric: "temperature_c",
  operator: ">",
  threshold: "",
};

export default function SmartAlertsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------- Farms / Alert Rules ----------------

  const [farms, setFarms] = useState([]);
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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

  // ---------------- Farms (needed for rule creation) ----------------

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function loadFarms() {
      const { data, error } = await supabase
        .from("farms")
        .select("id, farm_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        if (error) {
          console.error("Failed to load farms:", error);
        } else {
          setFarms(data ?? []);

          if (data && data.length > 0) {
            setForm((f) =>
              f.farm_id
                ? f
                : { ...f, farm_id: data[0].id }
            );
          }
        }
      }
    }

    loadFarms();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // ---------------- Alert rules ----------------

  async function loadRules() {
    if (!user?.id) return;

    setRulesLoading(true);

    const { data, error } = await supabase
      .from("alert_rules")
      .select("*, farms(farm_name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load alert rules:", error);
    } else {
      setRules(data ?? []);
    }

    setRulesLoading(false);
  }

  useEffect(() => {
    loadRules();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function updateForm(patch) {
    setForm((f) => {
      const next = { ...f, ...patch };

      // Keep metric valid whenever category changes
      if (
        patch.category &&
        !METRIC_OPTIONS[patch.category].some(
          (m) => m.value === f.metric
        )
      ) {
        next.metric =
          METRIC_OPTIONS[patch.category][0].value;
      }

      return next;
    });
  }

  async function handleCreateRule(e) {
    e.preventDefault();
    setFormError("");

    if (!form.farm_id) {
      setFormError(
        "Select a farm — rules need a farm to know the location."
      );
      return;
    }

    if (
      form.category === "market" &&
      !form.crop_name.trim()
    ) {
      setFormError(
        "Enter a crop/commodity name for a market price rule."
      );
      return;
    }

    const thresholdNum = Number(form.threshold);

    if (!Number.isFinite(thresholdNum)) {
      setFormError(
        "Enter a valid number for the threshold."
      );
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("alert_rules")
      .insert({
        user_id: user.id,
        farm_id: form.farm_id,
        category: form.category,
        crop_name: form.crop_name.trim() || null,
        metric: form.metric,
        operator: form.operator,
        threshold: thresholdNum,
        is_active: true,
      });

    setSubmitting(false);

    if (error) {
      console.error(
        "Failed to create alert rule:",
        error
      );
      setFormError(
        "Couldn't save the rule — please try again."
      );
      return;
    }

    setForm((f) => ({
      ...EMPTY_FORM,
      farm_id: f.farm_id,
    }));

    setShowForm(false);
    loadRules();
  }

  async function handleToggleRule(rule) {
    setRules((prev) =>
      prev.map((r) =>
        r.id === rule.id
          ? {
              ...r,
              is_active: !r.is_active,
            }
          : r
      )
    );

    const { error } = await supabase
      .from("alert_rules")
      .update({
        is_active: !rule.is_active,
      })
      .eq("id", rule.id);

    if (error) {
      console.error(
        "Failed to toggle rule:",
        error
      );
      loadRules();
    }
  }

  async function handleDeleteRule(id) {
    setRules((prev) =>
      prev.filter((r) => r.id !== id)
    );

    const { error } = await supabase
      .from("alert_rules")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Failed to delete rule:",
        error
      );
      loadRules();
    }
  }

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

  // Only weather + market are live right now.
  const categoryCounts = useMemo(() => {
    const counts = {
      weather: 0,
      market: 0,
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

  function renderRuleRow(rule) {
    const metricLabel =
      METRIC_OPTIONS[rule.category]?.find(
        (m) => m.value === rule.metric
      )?.label ?? rule.metric;

    const categoryLabel =
      RULE_CATEGORY_OPTIONS.find(
        (c) => c.value === rule.category
      )?.label ?? rule.category;

    return (
      <div
        key={rule.id}
        className={`flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          rule.is_active
            ? "border-[#dfe5df] bg-white"
            : "border-[#e5e5e5] bg-[#f7f7f3] opacity-70"
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-[#24352a]">
            {categoryLabel} · {metricLabel}{" "}
            {rule.operator} {rule.threshold}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            {rule.farms?.farm_name ??
              "Unknown farm"}
            {rule.crop_name
              ? ` · ${rule.crop_name}`
              : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              handleToggleRule(rule)
            }
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              rule.is_active
                ? "bg-[#d9f4df] text-[#2d7355]"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {rule.is_active
              ? "Active"
              : "Paused"}
          </button>

          <button
            onClick={() =>
              handleDeleteRule(rule.id)
            }
            className="text-slate-400 hover:text-red-500"
            aria-label="Delete rule"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout title={t("Smart Alerts")}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {/* Heading */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#20291f]">
            {t("Smart Alert Center")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {unreadCount}{" "}
            {t("unread alerts")}
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

      {/* ================= CATEGORY CARDS ================= */}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>

      {/* ================= ALERT RULES ================= */}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#24352a]">
            Your Alert Rules
          </h3>

          {farms.length > 0 && (
            <button
              onClick={() =>
                setShowForm((s) => !s)
              }
              className="flex items-center gap-1.5 rounded-full bg-[#214d34] px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-[#1a3d29]"
            >
              {showForm ? (
                <X size={15} />
              ) : (
                <Plus size={15} />
              )}

              {showForm
                ? "Cancel"
                : "New Alert Rule"}
            </button>
          )}
        </div>

        {farms.length === 0 &&
          !rulesLoading && (
            <p className="rounded-xl bg-[#f7f7f3] p-4 text-sm text-slate-500">
              Add a farm first (Farm Dashboard) —
              alert rules need a farm to know the
              location for weather/mandi lookups.
            </p>
          )}

        {showForm && (
          <form
            onSubmit={handleCreateRule}
            className="mb-5 grid grid-cols-1 gap-4 rounded-2xl border border-[#dfe5df] bg-white p-5 sm:grid-cols-2"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-500">
                Farm
              </label>

              <select
                value={form.farm_id}
                onChange={(e) =>
                  updateForm({
                    farm_id: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#dfe5df] p-2 text-sm"
              >
                {farms.map((f) => (
                  <option
                    key={f.id}
                    value={f.id}
                  >
                    {f.farm_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500">
                Category
              </label>

              <select
                value={form.category}
                onChange={(e) =>
                  updateForm({
                    category: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#dfe5df] p-2 text-sm"
              >
                {RULE_CATEGORY_OPTIONS.map(
                  (c) => (
                    <option
                      key={c.value}
                      value={c.value}
                    >
                      {c.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {form.category === "market" && (
              <div>
                <label className="block text-xs font-semibold text-slate-500">
                  Crop / Commodity
                </label>

                <input
                  type="text"
                  value={form.crop_name}
                  onChange={(e) =>
                    updateForm({
                      crop_name:
                        e.target.value,
                    })
                  }
                  placeholder="e.g. Cotton"
                  className="mt-1 w-full rounded-lg border border-[#dfe5df] p-2 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500">
                Metric
              </label>

              <select
                value={form.metric}
                onChange={(e) =>
                  updateForm({
                    metric: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#dfe5df] p-2 text-sm"
              >
                {METRIC_OPTIONS[
                  form.category
                ].map((m) => (
                  <option
                    key={m.value}
                    value={m.value}
                  >
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500">
                Condition
              </label>

              <select
                value={form.operator}
                onChange={(e) =>
                  updateForm({
                    operator:
                      e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#dfe5df] p-2 text-sm"
              >
                {OPERATOR_OPTIONS.map(
                  (o) => (
                    <option
                      key={o.value}
                      value={o.value}
                    >
                      {o.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500">
                Threshold
              </label>

              <input
                type="number"
                step="any"
                value={form.threshold}
                onChange={(e) =>
                  updateForm({
                    threshold:
                      e.target.value,
                  })
                }
                placeholder="e.g. 35"
                className="mt-1 w-full rounded-lg border border-[#dfe5df] p-2 text-sm"
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600 sm:col-span-2">
                {formError}
              </p>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#2d7355] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1f5b3d] disabled:opacity-60"
              >
                {submitting
                  ? "Saving…"
                  : "Save Rule"}
              </button>
            </div>
          </form>
        )}

        {rulesLoading ? (
          <p className="text-sm text-slate-500">
            Loading rules…
          </p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-slate-500">
            No alert rules yet — create one above
            to start getting weather or price
            alerts.
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map(renderRuleRow)}
          </div>
        )}
      </section>

      {/* ================= NOTIFICATIONS ================= */}

      {loading && (
        <p className="mt-6 text-sm text-slate-500">
          {t("Loading alerts…")}
        </p>
      )}

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

