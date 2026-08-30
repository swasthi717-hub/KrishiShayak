import React from "react";
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
} from "lucide-react";

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


/* ================= TOP BAR ================= */

function TopBar({ title }) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between border-b border-[#e5dfd2] bg-white px-4 py-3 md:px-6">
      
      <h1 className="font-serif text-xl font-bold text-[#24352a]">
        {title}
      </h1>

      <div className="flex items-center gap-4">

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


/* ================= LAYOUT ================= */

export default function Layout({ title, children }) {
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

    </div>
  );
}