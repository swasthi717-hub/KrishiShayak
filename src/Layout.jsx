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
  Wheat,
  HelpCircle,
  WifiOff,
  RefreshCw,
} from "lucide-react";

import { getCurrentUser } from "./services/auth";
import { requestAndSaveFCMToken, listenForForegroundMessages } from "./firebase";
import { useOfflineSync } from "./hooks/useOfflineSync";

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

function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-[#e5dfd2] bg-white">
      
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1f5b3d] text-white">
          <Wheat size={18} />
        </div>

        <div className="leading-tight">
          <p className="font-serif text-sm font-bold text-[#254a32]">
            KrishiShayak
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
            <NavLink
              key={label}
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
                {label}
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


/* ================= OFFLINE / SYNC STATUS BADGE ================= */
// Small pill shown in the TopBar. Reads live from useOfflineSync (file 07),
// which itself watches Dexie's pendingActions table + the browser's
// online/offline events — no polling needed, it re-renders automatically
// whenever the queue changes.

function SyncStatusBadge() {
  const { isOnline, pendingCount, conflicts, permanentFailures } = useOfflineSync();

  if (isOnline && pendingCount === 0 && conflicts.length === 0 && permanentFailures.length === 0) {
    return null; // nothing to show when everything's fully synced and online
  }

  if (!isOnline) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        <WifiOff size={12} />
        Offline{pendingCount > 0 ? ` · ${pendingCount} waiting` : ""}
      </span>
    );
  }

  if (conflicts.length > 0 || permanentFailures.length > 0) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        {conflicts.length + permanentFailures.length} need review
      </span>
    );
  }

  // Online, but still draining the queue (e.g. just reconnected)
  return (
    <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
      <RefreshCw size={12} className="animate-spin" />
      Syncing {pendingCount}
    </span>
  );
}


/* ================= TOP BAR ================= */

function TopBar({ title }) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between border-b border-[#e5dfd2] bg-white px-4 py-3 md:px-6">
      
      <h1 className="font-serif text-xl font-bold text-[#24352a]">
        {title}
      </h1>

      <div className="flex items-center gap-4">

        {/* Offline / sync status */}
        <SyncStatusBadge />

        {/* Bell → Smart Alerts */}
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

        {/* Profile icon */}
        <button
          onClick={() => navigate("/profile")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5f0df] text-[#1f5b3d]"
          aria-label="Profile"
        >
          <User size={16} />
        </button>

      </div>
    </header>
  );
}


/* ================= HELP BUTTON ================= */

function HelpButton() {
  return (
    <button className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#24352a] text-white shadow-lg hover:bg-[#1a271f]">
      <HelpCircle size={20} />
    </button>
  );
}


/* ================= FOREGROUND ALERT TOAST ================= */
// Minimal toast for push notifications that arrive while the app is open
// and active. onBackgroundMessage (in public/firebase-messaging-sw.js)
// handles the app-closed/backgrounded case separately — this covers the
// gap that leaves, since Firebase does NOT show a toast automatically
// for foreground messages the way it does for background ones.

function ForegroundAlertToast({ alert }) {
  if (!alert) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 rounded-xl border border-[#e5dfd2] bg-white p-4 shadow-lg">
      <p className="text-sm font-semibold text-[#24352a]">{alert.title}</p>
      {alert.body && <p className="mt-1 text-xs text-slate-500">{alert.body}</p>}
    </div>
  );
}


/* ================= LAYOUT ================= */

export default function Layout({ title, children }) {
  const [foregroundAlert, setForegroundAlert] = useState(null);

  useEffect(() => {
    let dismissTimer;

    (async () => {
      // getCurrentUser() reads the active Supabase session — if the user
      // isn't logged in yet, this resolves to null and we simply skip FCM
      // setup rather than erroring.
      const user = await getCurrentUser();
      if (!user?.id) return;

      // Registers the FCM service worker (on its own scope, so it doesn't
      // conflict with the Workbox PWA service worker), gets a push token,
      // and saves it to this user's profile row in Supabase.
      requestAndSaveFCMToken(user.id);

      // Handles pushes that arrive while this tab is open and focused —
      // onBackgroundMessage in the SW file only fires when the tab is
      // closed or backgrounded, so this is the other half of the picture.
      listenForForegroundMessages((notifTitle, notifBody) => {
        setForegroundAlert({ title: notifTitle, body: notifBody });
        clearTimeout(dismissTimer);
        dismissTimer = setTimeout(() => setForegroundAlert(null), 6000);
      });
    })();

    return () => clearTimeout(dismissTimer);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#faf7ef] font-sans text-[#24352a]">

      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">

        <TopBar title={title} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>

      </div>

      <HelpButton />

      <ForegroundAlertToast alert={foregroundAlert} />

    </div>
  );
}