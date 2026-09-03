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

// FIX: this page previously rendered a hardcoded ALERTS array and never
// touched the `notifications` table at all — so even a successfully
// delivered push notification would never show up here. This version
// fetches real rows and subscribes to realtime inserts so the list
// updates live while the app is open.

const CATEGORY_ICON = {
  weather: CloudRain,
  pest_disease: Bug,
  market: TrendingUp,
  yield_risk: AlertTriangle,
  system: Bell,
};

const CATEGORY_LABEL = {
  weather: "Weather",
  pest_disease: "Pest & Disease",
  market: "Market Price",
  yield_risk: "Yield Risk",
  system: "System",
};

// weather/pest alerts are framed as "action required"; market/yield/system
// as lower-urgency "notifications" — mirrors the original mock's grouping.
function sectionForCategory(category) {
  return category === "weather" || category === "pest_disease" ? "action" : "notification";
}

function severityLabel(severity) {
  if (severity === "urgent") return "High";
  if (severity === "warn") return "Medium";
  return "Low";
}

function severityClass(severity) {
  const label = severityLabel(severity);
  if (label === "High") return "bg-red-100 text-red-700";
  if (label === "Medium") return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-500";
}

function relativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function SmartAlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function loadAlerts() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!cancelled) {
        if (error) {
          console.error("Failed to load notifications:", error);
        } else {
          setAlerts(data ?? []);
        }
        setLoading(false);
      }
    }

    loadAlerts();

    // Live updates: if a push notification is sent while the app is open,
    // this makes it appear in the list immediately without a refresh.
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setAlerts((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function markAsRead(id) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) console.error("Failed to mark alert read:", error);
  }

  async function markAllAsRead() {
    const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (unreadIds.length === 0) return;
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    if (error) console.error("Failed to mark all read:", error);
  }

  const unreadCount = useMemo(() => alerts.filter((a) => !a.is_read).length, [alerts]);
  const actionAlerts = useMemo(() => alerts.filter((a) => sectionForCategory(a.category) === "action"), [alerts]);
  const notificationAlerts = useMemo(() => alerts.filter((a) => sectionForCategory(a.category) === "notification"), [alerts]);

  const categoryCounts = useMemo(() => {
    const counts = { weather: 0, pest_disease: 0, market: 0, yield_risk: 0 };
    for (const a of alerts) {
      if (counts[a.category] !== undefined) counts[a.category]++;
    }
    return counts;
  }, [alerts]);

  function renderAlertCard(alertRow) {
    const Icon = CATEGORY_ICON[alertRow.category] || Bell;
    const isRead = alertRow.is_read;
    const isAction = sectionForCategory(alertRow.category) === "action";

    return (
      <div
        key={alertRow.id}
        className={`rounded-2xl border p-5 transition ${
          isRead ? "border-[#dfe5df] bg-[#f7f7f3]" : isAction ? "border-red-300 bg-[#fff3f3]" : "border-green-200 bg-[#f3fff6]"
        }`}
      >
        <div className="flex gap-4">
          <div className="shrink-0 pt-0.5">
            <Icon size={22} className={isRead ? "text-slate-400" : isAction ? "text-red-500" : "text-green-500"} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <h4 className={`text-lg font-bold ${isRead ? "text-slate-500" : isAction ? "text-red-600" : "text-[#24352a]"}`}>
                {alertRow.title}
              </h4>
              <span className="shrink-0 text-sm text-slate-500">{relativeTime(alertRow.created_at)}</span>
            </div>

            <p className={`mt-2 text-base leading-6 ${isRead ? "text-slate-400" : "text-slate-600"}`}>
              {alertRow.body}
            </p>

            <div className="mt-4 flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-sm font-semibold text-[#2d7355] hover:text-[#1f5b3d]">
                <Mic size={15} />
                Ask AI
              </button>

              {!isRead && (
                <button
                  onClick={() => markAsRead(alertRow.id)}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  Mark Read
                </button>
              )}
            </div>
          </div>

          <div className="hidden shrink-0 sm:block">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${severityClass(alertRow.severity)}`}>
              {severityLabel(alertRow.severity)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Smart Alerts">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#20291f]">Smart Alert Center</h2>
          <p className="mt-1 text-sm text-slate-500">{unreadCount} unread alerts</p>
        </div>

        <button
          onClick={markAllAsRead}
          className="flex w-fit items-center gap-2 rounded-full bg-[#d9f4df] px-4 py-2 text-sm font-semibold text-[#2d7355] transition hover:bg-[#c9ebd1]"
        >
          <CheckCircle2 size={17} />
          Mark All Read
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-[#eef5ff] p-5">
          <div className="flex items-center gap-3">
            <CloudRain size={22} className="text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-[#24352a]">{categoryCounts.weather}</p>
              <p className="text-sm text-slate-500">Weather</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#fff0f1] p-5">
          <div className="flex items-center gap-3">
            <Bug size={22} className="text-red-500" />
            <div>
              <p className="text-2xl font-bold text-[#24352a]">{categoryCounts.pest_disease}</p>
              <p className="text-sm text-slate-500">Pest & Disease</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#effbf3] p-5">
          <div className="flex items-center gap-3">
            <TrendingUp size={22} className="text-green-500" />
            <div>
              <p className="text-2xl font-bold text-[#24352a]">{categoryCounts.market}</p>
              <p className="text-sm text-slate-500">Market Price</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#fff7ec] p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle size={22} className="text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-[#24352a]">{categoryCounts.yield_risk}</p>
              <p className="text-sm text-slate-500">Yield Risk</p>
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading alerts…</p>}

      {!loading && alerts.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">No alerts yet — you'll see weather, pest, market, and yield alerts here once they start coming in.</p>
      )}

      {actionAlerts.length > 0 && (
        <section className="mt-7">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-red-400" />
            <h3 className="text-lg font-bold text-red-600">Smart Alerts — Action Required</h3>
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
              {actionAlerts.filter((a) => !a.is_read).length} Unread
            </span>
          </div>
          <div className="space-y-3">{actionAlerts.map(renderAlertCard)}</div>
        </section>
      )}

      {notificationAlerts.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-blue-400" />
            <h3 className="text-lg font-bold text-[#24352a]">Notifications</h3>
            <span className="rounded-full bg-[#e9e7df] px-2.5 py-1 text-xs font-bold text-slate-500">
              {notificationAlerts.filter((a) => !a.is_read).length} Unread
            </span>
          </div>
          <div className="space-y-3">{notificationAlerts.map(renderAlertCard)}</div>
        </section>
      )}
    </Layout>
  );
}