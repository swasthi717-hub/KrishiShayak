import React, { useEffect, useState } from "react";
import {
  Bell,
  MapPin,
  Leaf,
  Globe,
  Phone,
} from "lucide-react";

import Layout from "./Layout.jsx";
import { useLanguage } from "./context/LanguageContext";
import { translateTexts } from "./services/translation";

import { useAuth } from "./context/AuthContext";

const LANGUAGES = [
  { code: "hi", native: "हिंदी", name: "Hindi" },
  { code: "mr", native: "मराठी", name: "Marathi" },
  { code: "ta", native: "தமிழ்", name: "Tamil" },
  { code: "te", native: "తెలుగు", name: "Telugu" },
  { code: "en", native: "English", name: "English" },
  { code: "pa", native: "ਪੰਜਾਬੀ", name: "Punjabi" },
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

const ENGLISH_TEXTS = {
  profile: "Profile",
  farmerProfile: "Farmer Profile",
  farmer: "Farmer",
  maharashtra: "Maharashtra",

  farmSize: "Farm Size",
  experience: "Experience",
  active: "Active",

  farmLocation: "Farm Location",
  currentCrops: "Current Crops",
  preferredLanguage: "Preferred Language",
  phoneNumber: "Phone Number",

  notificationPreferences: "Notification Preferences",

  weatherAlerts: "Weather Alerts",
  weatherDescription: "Rain, heatwave, frost warnings",

  pestDiseaseAlerts: "Pest & Disease Alerts",
  pestDiseaseDescription: "Outbreak risk notifications",

  marketPriceUpdates: "Market Price Updates",
  marketPriceDescription: "Daily mandi price summary",

  aiFarmingTips: "AI Farming Tips",
  aiFarmingTipsDescription: "Daily crop care advice",

  yieldRiskAlerts: "Yield Risk Alerts",
  yieldRiskDescription: "Low soil moisture, high temp",

  languageSettings: "Language Settings",

  helpline: "Helpline",
  kisanHelpline: "Kisan Helpline",
  freeAvailable: "Free · Available 24/7",

  acres: "Acres",
  years: "Yrs",
  crops: "Crops",
  districtUnavailable: "District unavailable",
  stateUnavailable: "State unavailable",
  noCropsAdded: "No crops added",
  notProvided: "Not provided",
  crop: "Crop",
};

export default function ProfilePage() {
  const { language, setLanguage } = useLanguage();
  const { farmerData } = useAuth();

  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [translations, setTranslations] = useState(ENGLISH_TEXTS);
  const [isTranslating, setIsTranslating] = useState(false);

  const profile = farmerData?.profile;
  const farm = farmerData?.farm;
  const crops = farmerData?.crops || [];

  /*
   * Convert the global language code into the language object
   * used by the language selector.
   */
  const selectedLanguage =
    LANGUAGES.find((item) => item.code === language) || LANGUAGES[4];

  /*
   * Translate Profile page whenever the global language changes.
   * The translation API is used here only; translation.js is unchanged.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadTranslations() {
      if (!language || language === "en") {
        setTranslations(ENGLISH_TEXTS);
        setIsTranslating(false);
        return;
      }

      setIsTranslating(true);

      try {
        const keys = Object.keys(ENGLISH_TEXTS);
        const englishTexts = Object.values(ENGLISH_TEXTS);

        const translated = await translateTexts(
          englishTexts,
          language,
          "en"
        );

        if (cancelled) return;

        const translatedObject = {};

        keys.forEach((key, index) => {
          translatedObject[key] =
            translated[index] || ENGLISH_TEXTS[key];
        });

        setTranslations(translatedObject);
      } catch (error) {
        console.error("Profile translation error:", error);

        if (!cancelled) {
          setTranslations(ENGLISH_TEXTS);
        }
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    }

    loadTranslations();

    return () => {
      cancelled = true;
    };
  }, [language]);

  function toggleAlert(index) {
    setAlerts((current) =>
      current.map((alert, i) =>
        i === index
          ? { ...alert, enabled: !alert.enabled }
          : alert
      )
    );
  }

  /*
   * Global language change.
   * This changes the language for the whole application.
   */
  function handleLanguageChange(languageCode) {
    setLanguage(languageCode);
  }

  const translatedAlerts = [
    {
      title: translations.weatherAlerts,
      description: translations.weatherDescription,
    },
    {
      title: translations.pestDiseaseAlerts,
      description: translations.pestDiseaseDescription,
    },
    {
      title: translations.marketPriceUpdates,
      description: translations.marketPriceDescription,
    },
    {
      title: translations.aiFarmingTips,
      description: translations.aiFarmingTipsDescription,
    },
    {
      title: translations.yieldRiskAlerts,
      description: translations.yieldRiskDescription,
    },
  ];

  const farmArea =
    farm?.area !== null && farm?.area !== undefined
      ? `${farm.area} ${farm?.area_unit || translations.acres}`
      : "--";

  const cropCountLabel =
    crops.length === 1
      ? `1 ${translations.crop}`
      : `${crops.length} ${translations.crops}`;

  const experienceValue =
    profile?.experience_years !== null &&
    profile?.experience_years !== undefined
      ? `${profile.experience_years} ${translations.years}`
      : "--";

  return (
    <Layout title={translations.profile}>
      <div className="space-y-5">
        {/* Page Heading */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#24352a]">
            {translations.farmerProfile}
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
                {profile?.name || translations.farmer}
              </h3>

              <p className="mt-1 text-sm text-white/70">
                {translations.farmer} ·{" "}
                {profile?.state || translations.maharashtra}
              </p>

              <div className="my-5 h-px w-full bg-white/20" />

              {/* Stats */}
              <div className="grid w-full grid-cols-3 gap-3">
                <div>
                  <p className="text-lg font-bold">{farmArea}</p>
                  <p className="text-xs text-white/60">
                    {translations.farmSize}
                  </p>
                </div>

                <div>
                  <p className="text-lg font-bold">{experienceValue}</p>
                  <p className="text-xs text-white/60">
                    {translations.experience}
                  </p>
                </div>

                <div>
                  <p className="text-lg font-bold">{cropCountLabel}</p>
                  <p className="text-xs text-white/60">
                    {translations.active}
                  </p>
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
                  {translations.farmLocation}
                </p>

                <p className="mt-1 text-sm font-semibold text-[#24352a]">
                  {profile?.district || translations.districtUnavailable},{" "}
                  {profile?.state || translations.stateUnavailable}
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
                  {translations.currentCrops}
                </p>

                <p className="mt-1 text-sm font-semibold text-[#24352a]">
                  {crops.length > 0
                    ? crops
                        .map(
                          (crop) =>
                            `${crop.crop_name}${
                              crop.acreage
                                ? ` (${crop.acreage} ${
                                    farm?.area_unit || "acre"
                                  })`
                                : ""
                            }`
                        )
                        .join(" · ")
                    : translations.noCropsAdded}
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
                  {translations.preferredLanguage}
                </p>

                <p className="mt-1 text-sm font-semibold text-[#24352a]">
                  {selectedLanguage.name}
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
                  {translations.phoneNumber}
                </p>

                <p className="mt-1 text-sm font-semibold text-[#24352a]">
                  {profile?.phone || translations.notProvided}
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
              {translations.notificationPreferences}
            </h3>

            <div className="mt-4">
              {alerts.map((alert, index) => {
                const translatedAlert = translatedAlerts[index];

                return (
                  <div
                    key={alert.title}
                    className="flex items-center justify-between border-b border-[#e5dfd2] py-3.5 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#24352a]">
                        {translatedAlert.title}
                      </p>

                      <p className="mt-0.5 text-sm text-[#777c76]">
                        {translatedAlert.description}
                      </p>
                    </div>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleAlert(index)}
                      aria-label={`Toggle ${alert.title}`}
                      className={`relative h-7 w-12 shrink-0 overflow-hidden rounded-full transition-colors ${
                        alert.enabled
                          ? "bg-[#2d7054]"
                          : "bg-[#d1d3d2]"
                      }`}
                    >
                      <span
                        className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          alert.enabled
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5 lg:col-span-2">
            {/* Language Settings */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
              <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#24352a]">
                <Globe size={18} className="text-[#2d7054]" />
                {translations.languageSettings}
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {LANGUAGES.map((languageOption) => {
                  const isSelected =
                    language === languageOption.code;

                  return (
                    <button
                      key={languageOption.code}
                      type="button"
                      onClick={() =>
                        handleLanguageChange(languageOption.code)
                      }
                      className={`flex h-[70px] flex-col items-center justify-center rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "border-[#2d7054] bg-[#2d7054] text-white"
                          : "border-[#e3e5e1] bg-white text-[#24352a] hover:bg-[#f7f5ee]"
                      }`}
                    >
                      <span className="text-base font-bold">
                        {languageOption.native}
                      </span>

                      <span
                        className={`mt-0.5 text-xs ${
                          isSelected
                            ? "text-white/70"
                            : "text-[#777c76]"
                        }`}
                      >
                        {languageOption.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {isTranslating && (
                <p className="mt-3 text-center text-xs text-[#777c76]">
                  Translating...
                </p>
              )}
            </div>

            {/* Helpline */}
            <div className="rounded-2xl bg-[#d8f4dc] p-5">
              <p className="text-sm font-semibold text-[#2d7054]">
                {translations.helpline}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2d7054] text-white">
                  <Phone size={23} />
                </div>

                <div>
                  <p className="text-base font-bold text-[#24352a]">
                    {translations.kisanHelpline}
                  </p>

                  <p className="text-lg font-bold text-[#2d7054]">
                    1800-180-1551
                  </p>

                  <p className="text-xs text-[#737b74]">
                    {translations.freeAvailable}
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
