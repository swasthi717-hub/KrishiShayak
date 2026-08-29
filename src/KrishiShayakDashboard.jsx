import React from "react";
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

const NAV_ITEMS = [
  { label: "Home", icon: Home, active: true },
  { label: "AI Copilot", icon: Mic },
  { label: "Weather", icon: CloudSun },
  { label: "Crop Scanner", icon: Camera },
  { label: "Mandi Market", icon: TrendingUp },
  { label: "Farm Dashboard", icon: BarChart3 },
  { label: "Smart Alerts", icon: Bell, badge: 3 },
  { label: "Profile", icon: User },
];

const ALERTS = [
  {
    emoji: "⚠️🐛",
    title: "Pest Outbreak!",
    badge: "Urgent",
    description: "High bollworm risk — inspect cotton today.",
    linkText: "Get Advice",
    theme: "red",
  },
  {
    emoji: "🌧️",
    title: "Rain Tomorrow",
    description: "Skip irrigation today. Drain paddy fields.",
    linkText: "View Weather",
    theme: "blue",
  },
  {
    emoji: "📈",
    title: "Tomato Prices Up",
    description: "₹1,960/Q at Nashik — good time to sell.",
    linkText: "See Prices",
    theme: "green",
  },
  {
    emoji: "🌡️",
    title: "Heatwave Next Week",
    description: "Temp >40°C on Tuesday. Increase irrigation.",
    linkText: "View Weather",
    theme: "orange",
  },
];

const STATS = [
  { icon: Wheat, value: "58 Q", label: "Yield Estimate", sub: "+8% vs last season", theme: "green" },
  { icon: TrendingUp, value: "₹1.1L", label: "Expected Profit", sub: "This season", theme: "green" },
  { icon: Activity, value: "82/100", label: "Farm Health", sub: "Good condition", theme: "blue" },
  { icon: Bell, value: "3 New", label: "Alerts Today", sub: "Tap to review", theme: "red" },
];

const ALERT_THEMES = {
  red: {
    card: "bg-red-50 border-red-200",
    link: "text-red-600 hover:text-red-700",
    badge: "bg-red-600 text-white",
  },
  blue: {
    card: "bg-blue-50 border-blue-200",
    link: "text-green-700 hover:text-green-800",
  },
  green: {
    card: "bg-green-50 border-green-200",
    link: "text-green-700 hover:text-green-800",
  },
  orange: {
    card: "bg-orange-50 border-orange-200",
    link: "text-green-700 hover:text-green-800",
  },
};

const STAT_THEMES = {
  green: "text-green-600",
  blue: "text-blue-600",
  red: "text-red-500",
};

function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700 text-white">
          <Wheat size={18} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-slate-900">KrishiShayak</p>
          <p className="text-xs text-slate-500">AI Farming Copilot</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ label, icon: Icon, active, badge }) => (
          <button
            key={label}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-green-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
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
        ))}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-200 text-sm font-semibold text-orange-800">
          RP
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-800">Ramesh Patil</p>
          <p className="text-xs text-slate-500">Nashik · Cotton, Wheat</p>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
      <h1 className="text-xl font-bold text-slate-900">Home</h1>
      <div className="flex items-center gap-4">
        <button className="relative text-slate-500 hover:text-slate-700">
          <Bell size={20} />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <User size={16} />
        </div>
      </div>
    </header>
  );
}

function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="h-72 w-full bg-cover bg-center sm:h-64"
        style={{ backgroundImage: "url('https://i.pinimg.com/736x/38/ef/ad/38efadb7ab46f87f0353e4f449412e27.jpg')" }}
      />
<div className="absolute inset-0 bg-green-800/30" />

      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-md text-white">
            <p className="flex items-center gap-2 text-15px font-semibold text-white ">
              Good Morning <span>☀️</span>
            </p>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
              नमस्ते, रमेश जी!
            </h2>
            <p className="mt-5 text-15px font-semibold  text-white">
              Your farm is doing well. Rain expected tomorrow — check your
              action plan.
            </p>
          </div>

          <div className="hidden shrink-0 rounded-xl bg-white/15 p-10 text-white backdrop-blur-sm sm:block">
            <p className="text-3xl font-bold">34°C</p>
            <p className="text-base text-green-50/90">Nashik · Partly Sunny</p>
            <div className="mt-3 flex gap-7 text-sm">
              <span className="flex items-center gap-1">
                <Droplets size={12} /> 68%
              </span>
              <span className="flex items-center gap-1">
                <Wind size={12} /> 12 km/h
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-7">
          <button className="flex items-center gap-2 rounded-full bg-white px-5 py-1.5 text-sm font-semibold text-green-800 shadow-sm hover:bg-green-50">
            <Mic size={16} /> Talk to AI
          </button>
          <button className="flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600">
            <Camera size={16} /> Scan Crop
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertCard({ emoji, title, badge, description, linkText, theme }) {
  const t = ALERT_THEMES[theme];
  return (
    <div className={`rounded-xl border-2 p-5 ${t.card}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <span>{emoji}</span>
          {title}
        </p>
        {badge && (
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${t.badge}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm text-slate-500">{description}</p>
      <button className={`mt-2 flex items-center gap-1 text-sm font-bold ${t.link}`}>
        {linkText} <ChevronRight size={14} />
      </button>
    </div>
  );
}

function ActionPlanBanner() {
  return (
    <div className="rounded-xl bg-emerald-100 p-7">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-700 text-white">
          <Zap size={16} />
        </div>
        <p className="text-20px font-bold text-slate-800">Today's AI Action Plan</p>
      </div>
      <p className="mt-3 text-sm text-slate-700">
        Rain forecast for tomorrow. Apply fungicide today before 10 AM to
        protect wheat from blight. Skip irrigation. Check cotton field for
        bollworm signs — pest risk is elevated this week.
      </p>
      <button className="mt-4 flex items-center gap-2 rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
        <Mic size={14} /> Ask AI for Details
      </button>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, sub, theme }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <Icon size={18} className={STAT_THEMES[theme]} />
        <ChevronRight size={16} className="text-slate-300" />
      </div>
      <p className={`mt-2 text-xl font-bold ${STAT_THEMES[theme]}`}>{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{label}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}

export default function KrishiShayakDashboard() {
  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <HeroBanner />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Today's Alerts</h3>
                <button className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800">
                  View All <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ALERTS.map((alert) => (
                  <AlertCard key={alert.title} {...alert} />
                ))}
              </div>
            </div>

            <ActionPlanBanner />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}