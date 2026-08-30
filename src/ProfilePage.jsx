import React, { useState } from "react";
import {
  Bell,
  MapPin,
  Leaf,
  Globe,
  Phone,
  UserRound,
  Check,
} from "lucide-react";

import Layout from "./Layout.jsx";

const LANGUAGES = [
  { native: "हिंदी", name: "Hindi" },
  { native: "मराठी", name: "Marathi" },
  { native: "தமிழ்", name: "Tamil" },
  { native: "తెలుగు", name: "Telugu" },
  { native: "English", name: "English" },
  { native: "ਪੰਜਾਬੀ", name: "Punjabi" },
];

const INITIAL_ALERTS = [
  {
    title: "Weather Alerts",
    description: "Rain, heatwave, frost warnings",
    enabled: true,
  },
  {
    title: "Pest & Disease Alerts",
    description: "Outbreak risk notifications",
    enabled: true,
  },
  {
    title: "Market Price Updates",
    description: "Daily mandi price summary",
    enabled: true,
  },
  {
    title: "AI Farming Tips",
    description: "Daily crop care advice",
    enabled: false,
  },
  {
    title: "Yield Risk Alerts",
    description: "Low soil moisture, high temp",
    enabled: true,
  },
];

export default function ProfilePage() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [selectedLanguage, setSelectedLanguage] = useState("Hindi");

  function toggleAlert(index) {
    setAlerts((current) =>
      current.map((alert, i) =>
        i === index
          ? { ...alert, enabled: !alert.enabled }
          : alert
      )
    );
  }

  return (
    <Layout title="Profile">
      <div className="space-y-5">
        {/* Page Heading */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#24352a]">
            Farmer Profile
          </h2>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Main Profile Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#2d7054] p-6 text-white lg:row-span-2">
            {/* Decorative circle */}
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#3a7b5e] opacity-70" />

            <div className="relative flex flex-col items-center text-center">
              {/* Farmer Icon */}
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#5b9678] text-4xl">
                👨‍🌾
              </div>

              <h3 className="mt-4 font-serif text-2xl font-bold">
                Ramesh Patil
              </h3>

              <p className="mt-1 text-sm text-white/70">
                Farmer · Maharashtra
              </p>

              <div className="my-5 h-px w-full bg-white/20" />

              {/* Stats */}
              <div className="grid w-full grid-cols-3 gap-3">
                <div>
                  <p className="text-lg font-bold">4.2 Acres</p>
                  <p className="text-xs text-white/60">Farm Size</p>
                </div>

                <div>
                  <p className="text-lg font-bold">12 Yrs</p>
                  <p className="text-xs text-white/60">Experience</p>
                </div>

                <div>
                  <p className="text-lg font-bold">2 Crops</p>
                  <p className="text-xs text-white/60">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Farm Location */}
          <div className="min-h-[140px] rounded-2xl border border-[#dddcd4] bg-[#eeeee8] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-[#2d7054]">
                <MapPin size={21} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#70756e]">
                  Farm Location
                </p>

                <p className="mt-1 text-sm font-semibold text-[#24352a]">
                  Nashik, Maharashtra 422001
                </p>
              </div>
            </div>
          </div>

          {/* Current Crops */}
          <div className="min-h-[140px] rounded-2xl border border-[#cfe8d7] bg-[#f0fff5] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-green-600">
                <Leaf size={21} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#70756e]">
                  Current Crops
                </p>

                <p className="mt-1 text-sm font-semibold text-[#24352a]">
                  Cotton (2.5 ac) · Wheat (1.7 ac)
                </p>
              </div>
            </div>
          </div>

          {/* Preferred Language */}
          <div className="min-h-[140px] rounded-2xl border border-[#d4e0ef] bg-[#eff6ff] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-blue-600">
                <Globe size={21} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#70756e]">
                  Preferred Language
                </p>

                <p className="mt-1 text-sm font-semibold text-[#24352a]">
                  {selectedLanguage}
                </p>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="min-h-[140px] rounded-2xl border border-[#eadfce] bg-[#fff7ed] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-orange-600">
                <Phone size={21} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#70756e]">
                  Phone Number
                </p>

                <p className="mt-1 text-sm font-semibold text-[#24352a]">
                  +91 98765 43210
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Notification Preferences */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2] lg:col-span-3">
            <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#24352a]">
              <Bell size={18} className="text-[#2d7054]" />
              Notification Preferences
            </h3>

            <div className="mt-4">
              {alerts.map((alert, index) => (
                <div
                  key={alert.title}
                  className="flex items-center justify-between border-b border-[#e5dfd2] py-3.5 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#24352a]">
                      {alert.title}
                    </p>

                    <p className="mt-0.5 text-sm text-[#777c76]">
                      {alert.description}
                    </p>
                  </div>

                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleAlert(index)}
                    aria-label={`Toggle ${alert.title}`}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                      alert.enabled
                        ? "bg-[#2d7054]"
                        : "bg-[#d1d3d2]"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        alert.enabled
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5 lg:col-span-2">
            {/* Language Settings */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
              <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#24352a]">
                <Globe size={18} className="text-[#2d7054]" />
                Language Settings
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {LANGUAGES.map((language) => {
                  const isSelected =
                    selectedLanguage === language.name;

                  return (
                    <button
                      key={language.name}
                      type="button"
                      onClick={() =>
                        setSelectedLanguage(language.name)
                      }
                      className={`flex h-[70px] flex-col items-center justify-center rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "border-[#2d7054] bg-[#2d7054] text-white"
                          : "border-[#e3e5e1] bg-white text-[#24352a] hover:bg-[#f7f5ee]"
                      }`}
                    >
                      <span className="text-base font-bold">
                        {language.native}
                      </span>

                      <span
                        className={`mt-0.5 text-xs ${
                          isSelected
                            ? "text-white/70"
                            : "text-[#777c76]"
                        }`}
                      >
                        {language.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Helpline */}
            <div className="rounded-2xl bg-[#d8f4dc] p-5">
              <p className="text-sm font-semibold text-[#2d7054]">
                Helpline
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2d7054] text-white">
                  <Phone size={23} />
                </div>

                <div>
                  <p className="text-base font-bold text-[#24352a]">
                    Kisan Helpline
                  </p>

                  <p className="text-lg font-bold text-[#2d7054]">
                    1800-180-1551
                  </p>

                  <p className="text-xs text-[#737b74]">
                    Free · Available 24/7
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}