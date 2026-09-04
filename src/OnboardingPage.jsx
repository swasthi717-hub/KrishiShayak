import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";
import { translateTexts } from "./services/translation";
import { getCurrentLocation } from "./services/location";

const languages = [
  { code: "hi", name: "हिन्दी", english: "Hindi" },
  { code: "en", name: "English", english: "English" },
  { code: "mr", name: "मराठी", english: "Marathi" },
  { code: "bn", name: "বাংলা", english: "Bengali" },
  { code: "ta", name: "தமிழ்", english: "Tamil" },
  { code: "te", name: "తెలుగు", english: "Telugu" },
  { code: "kn", name: "ಕನ್ನಡ", english: "Kannada" },
  { code: "ml", name: "മലയാളം", english: "Malayalam" },
  { code: "gu", name: "ગુજરાતી", english: "Gujarati" },
  { code: "pa", name: "ਪੰਜਾਬੀ", english: "Punjabi" },
  { code: "or", name: "ଓଡ଼ିଆ", english: "Odia" },
];

const englishTexts = {
  title: "Tell us about your farm",
  subtitle:
    "Just a few details to personalise KrishiSahayak for you.",
  language: "Preferred language",
  name: "Your name",
  namePlaceholder: "Enter your name",
  land: "How much land do you farm?",
  landPlaceholder: "Enter land area",
  unit: "Unit",
  crop: "What is your main crop?",
  cropPlaceholder: "e.g. Wheat, Rice, Tomato",
  state: "State",
  statePlaceholder: "Enter your state",
  district: "District",
  districtPlaceholder: "Enter your district",
  continue: "Continue",
  saving: "Saving...",
  locationTitle: "Allow location access",
  locationDescription:
    "Allow location access so we can provide information relevant to your farm.",
  gettingLocation: "Getting location...",
  allowLocation: "Allow Location",
  skipLocation: "Skip for now",
  loggedInError: "You must be logged in.",
  nameError: "Please enter your name.",
  areaError: "Please enter your land area.",
  cropError: "Please enter your main crop.",
  genericError: "Something went wrong.",
  locationError: "Unable to get your location.",
  locationDenied:
    "Location permission was denied. You can allow it from your browser settings.",
  locationUnavailable:
    "Your location could not be determined. Please try again.",
  locationTimeout:
    "Location request timed out. Please try again.",
  onboardingError:
    "Unable to complete onboarding. Please try again.",
};

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();

  const { language, setLanguage } = useLanguage();

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("acre");
  const [crop, setCrop] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [translated, setTranslated] = useState(englishTexts);
  const [translationLoading, setTranslationLoading] = useState(false);

  const [locationStep, setLocationStep] = useState(false);
  const [farmId, setFarmId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadTranslations = async () => {
      if (language === "en") {
        setTranslated(englishTexts);
        setTranslationLoading(false);
        return;
      }

      setTranslationLoading(true);

      try {
        const keys = Object.keys(englishTexts);

        const translatedValues = await translateTexts(
          keys.map((key) => englishTexts[key]),
          language
        );

        if (cancelled) return;

        const result = {};

        keys.forEach((key, index) => {
          result[key] = translatedValues[index];
        });

        setTranslated(result);
      } catch (err) {
        console.error("Onboarding translation failed:", err);

        if (!cancelled) {
          setTranslated(englishTexts);
        }
      } finally {
        if (!cancelled) {
          setTranslationLoading(false);
        }
      }
    };

    loadTranslations();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError(englishTexts.loggedInError);
      return;
    }

    if (!name.trim()) {
      setError(englishTexts.nameError);
      return;
    }

    if (!area || Number(area) <= 0) {
      setError(englishTexts.areaError);
      return;
    }

    if (!crop.trim()) {
      setError(englishTexts.cropError);
      return;
    }

    try {
      setLoading(true);

      // 1. Create/update farmer profile.
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            name: name.trim(),
            preferred_language: language,
            state: state.trim() || null,
            district: district.trim() || null,
            onboarding_completed: false,
          },
          { onConflict: "user_id" }
        );

      if (profileError) {
        throw profileError;
      }

      // 2. Create farm.
      const { data: farm, error: farmError } = await supabase
        .from("farms")
        .insert({
          user_id: user.id,
          farm_name: `${name.trim()}'s Farm`,
          area: Number(area),
          area_unit: areaUnit,
          state: state.trim() || null,
          district: district.trim() || null,
        })
        .select()
        .single();

      if (farmError) {
        throw farmError;
      }

      // 3. Create main crop.
      const { error: cropError } = await supabase
        .from("crops")
        .insert({
          farm_id: farm.id,
          crop_name: crop.trim(),
          acreage: areaUnit === "acre" ? Number(area) : null,
        });

      if (cropError) {
        throw cropError;
      }

      // 4. Save the farm ID and move to the location step.
      setFarmId(farm.id);
      setLocationStep(true);
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(err.message || englishTexts.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = async () => {
    setError("");
    setLoading(true);

    try {
      const location = await getCurrentLocation();

      console.log("Farmer GPS location:", location);

      // Update the farm with GPS information.
      const { error: locationError } = await supabase
        .from("farms")
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          location_accuracy_meters: location.accuracy,
          location_source: "gps",
          location_updated_at: new Date().toISOString(),
        })
        .eq("id", farmId);

      if (locationError) {
        throw locationError;
      }

      // Mark onboarding as completed.
      const { error: onboardingError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);

      if (onboardingError) {
        throw onboardingError;
      }

      // Refresh profile so ProtectedRoute immediately sees completion.
      if (typeof refreshProfile === "function") {
        await refreshProfile();
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Location error:", err);

      let message = englishTexts.locationError;

      if (err.code === 1) {
        message = englishTexts.locationDenied;
      } else if (err.code === 2) {
        message = englishTexts.locationUnavailable;
      } else if (err.code === 3) {
        message = englishTexts.locationTimeout;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipLocation = async () => {
    if (!user) {
      setError(englishTexts.loggedInError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { error: onboardingError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);

      if (onboardingError) {
        throw onboardingError;
      }

      if (typeof refreshProfile === "function") {
        await refreshProfile();
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Error completing onboarding:", err);
      setError(err.message || englishTexts.onboardingError);
    } finally {
      setLoading(false);
    }
  };

  if (locationStep) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8f3e7",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            background: "#fffdf8",
            borderRadius: 20,
            padding: 32,
            boxShadow: "0 15px 50px rgba(0,0,0,.08)",
          }}
        >
          <h1 style={{ color: "#0c3d2b" }}>
            {translated.locationTitle}
          </h1>

          <p style={{ color: "#647067", marginBottom: 24 }}>
            {translated.locationDescription}
          </p>

          {error && (
            <div
              style={{
                background: "#fff0ee",
                color: "#b42318",
                padding: 10,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGetLocation}
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              border: 0,
              borderRadius: 10,
              background: loading ? "#8aa99a" : "#145a3f",
              color: "white",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? translated.gettingLocation
              : translated.allowLocation}
          </button>

          <button
            type="button"
            onClick={handleSkipLocation}
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              border: 0,
              background: "transparent",
              color: "#145a3f",
              fontWeight: 600,
              marginTop: 10,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {translated.skipLocation}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f3e7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fffdf8",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 15px 50px rgba(0,0,0,.08)",
        }}
      >
        <h1
          style={{
            color: "#0c3d2b",
            marginBottom: 8,
          }}
        >
          {translated.title}
        </h1>

        <p
          style={{
            color: "#647067",
            marginBottom: 24,
          }}
        >
          {translated.subtitle}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Language */}
          <label
            style={{
              display: "block",
              marginBottom: 8,
            }}
          >
            {translated.language}
          </label>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={inputStyle}
            disabled={translationLoading}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} — {lang.english}
              </option>
            ))}
          </select>

          {/* Name */}
          <label
            style={{
              display: "block",
              marginBottom: 8,
            }}
          >
            {translated.name}
          </label>

          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={translated.namePlaceholder}
          />

          {/* Land */}
          <label
            style={{
              display: "block",
              marginBottom: 8,
            }}
          >
            {translated.land}
          </label>

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <input
              style={{
                ...inputStyle,
                flex: 1,
              }}
              type="number"
              min="0"
              step="0.01"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder={translated.landPlaceholder}
            />

            <select
              value={areaUnit}
              onChange={(e) => setAreaUnit(e.target.value)}
              style={{
                ...inputStyle,
                width: 130,
              }}
            >
              <option value="acre">Acre</option>
              <option value="hectare">Hectare</option>
              <option value="bigha">Bigha</option>
              <option value="guntha">Guntha</option>
              <option value="sq_m">sq. m</option>
            </select>
          </div>

          {/* Crop */}
          <label
            style={{
              display: "block",
              marginBottom: 8,
            }}
          >
            {translated.crop}
          </label>

          <input
            style={inputStyle}
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder={translated.cropPlaceholder}
          />

          {/* State */}
          <label
            style={{
              display: "block",
              marginBottom: 8,
            }}
          >
            {translated.state}
          </label>

          <input
            style={inputStyle}
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder={translated.statePlaceholder}
          />

          {/* District */}
          <label
            style={{
              display: "block",
              marginBottom: 8,
            }}
          >
            {translated.district}
          </label>

          <input
            style={inputStyle}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder={translated.districtPlaceholder}
          />

          {/* Error */}
          {error && (
            <div
              style={{
                background: "#fff0ee",
                color: "#b42318",
                padding: 10,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              border: 0,
              borderRadius: 10,
              background: loading ? "#8aa99a" : "#145a3f",
              color: "white",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 10,
            }}
          >
            {loading ? translated.saving : translated.continue}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 9,
  border: "1px solid #d8d2c4",
  background: "#fff",
  color: "#0c3d2b",
  fontSize: 14,
  outline: "none",
  marginBottom: 14,
  boxSizing: "border-box",
};
