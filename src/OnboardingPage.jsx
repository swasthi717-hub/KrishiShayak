import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";
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

const translations = {
  en: {
    title: "Tell us about your farm",
    subtitle: "Just a few details to personalise KrishiSahayak for you.",
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
  },

  hi: {
    title: "अपने खेत के बारे में बताएं",
    subtitle: "KrishiSahayak को आपके लिए बेहतर बनाने के लिए कुछ जानकारी दें।",
    name: "आपका नाम",
    namePlaceholder: "अपना नाम दर्ज करें",
    land: "आप कितनी जमीन पर खेती करते हैं?",
    landPlaceholder: "जमीन का क्षेत्रफल",
    unit: "इकाई",
    crop: "आपकी मुख्य फसल कौन सी है?",
    cropPlaceholder: "जैसे गेहूं, धान, टमाटर",
    state: "राज्य",
    statePlaceholder: "अपना राज्य दर्ज करें",
    district: "जिला",
    districtPlaceholder: "अपना जिला दर्ज करें",
    continue: "आगे बढ़ें",
    saving: "सहेजा जा रहा है...",
  },

  mr: {
    title: "तुमच्या शेताबद्दल सांगा",
    subtitle: "KrishiSahayak तुमच्यासाठी वैयक्तिकृत करण्यासाठी काही माहिती द्या.",
    name: "तुमचे नाव",
    namePlaceholder: "तुमचे नाव लिहा",
    land: "तुम्ही किती जमिनीवर शेती करता?",
    landPlaceholder: "जमिनीचे क्षेत्रफळ",
    unit: "एकक",
    crop: "तुमचे मुख्य पीक कोणते?",
    cropPlaceholder: "उदा. गहू, तांदूळ, टोमॅटो",
    state: "राज्य",
    statePlaceholder: "तुमचे राज्य लिहा",
    district: "जिल्हा",
    districtPlaceholder: "तुमचा जिल्हा लिहा",
    continue: "पुढे जा",
    saving: "जतन करत आहे...",
  },

  ta: {
    title: "உங்கள் பண்ணையைப் பற்றி சொல்லுங்கள்",
    subtitle: "KrishiSahayak உங்களுக்கேற்ப செயல்பட சில தகவல்களை வழங்குங்கள்.",
    name: "உங்கள் பெயர்",
    namePlaceholder: "உங்கள் பெயரை உள்ளிடவும்",
    land: "நீங்கள் எவ்வளவு நிலத்தில் விவசாயம் செய்கிறீர்கள்?",
    landPlaceholder: "நில அளவை உள்ளிடவும்",
    unit: "அலகு",
    crop: "உங்கள் முக்கிய பயிர் எது?",
    cropPlaceholder: "எ.கா. கோதுமை, நெல், தக்காளி",
    state: "மாநிலம்",
    statePlaceholder: "உங்கள் மாநிலத்தை உள்ளிடவும்",
    district: "மாவட்டம்",
    districtPlaceholder: "உங்கள் மாவட்டத்தை உள்ளிடவும்",
    continue: "தொடரவும்",
    saving: "சேமிக்கப்படுகிறது...",
  },

  te: {
    title: "మీ పొలం గురించి చెప్పండి",
    subtitle: "KrishiSahayak మీ కోసం వ్యక్తిగతీకరించడానికి కొన్ని వివరాలు ఇవ్వండి.",
    name: "మీ పేరు",
    namePlaceholder: "మీ పేరు నమోదు చేయండి",
    land: "మీరు ఎంత భూమిలో వ్యవసాయం చేస్తున్నారు?",
    landPlaceholder: "భూమి విస్తీర్ణం",
    unit: "యూనిట్",
    crop: "మీ ప్రధాన పంట ఏమిటి?",
    cropPlaceholder: "ఉదా. గోధుమ, వరి, టమాటా",
    state: "రాష్ట్రం",
    statePlaceholder: "మీ రాష్ట్రాన్ని నమోదు చేయండి",
    district: "జిల్లా",
    districtPlaceholder: "మీ జిల్లాను నమోదు చేయండి",
    continue: "కొనసాగించండి",
    saving: "సేవ్ చేస్తోంది...",
  },

  bn: {
    title: "আপনার খামার সম্পর্কে বলুন",
    subtitle: "KrishiSahayak আপনার জন্য ব্যক্তিগতকৃত করতে কিছু তথ্য দিন।",
    name: "আপনার নাম",
    namePlaceholder: "আপনার নাম লিখুন",
    land: "আপনি কত জমিতে চাষ করেন?",
    landPlaceholder: "জমির পরিমাণ লিখুন",
    unit: "একক",
    crop: "আপনার প্রধান ফসল কী?",
    cropPlaceholder: "যেমন গম, ধান, টমেটো",
    state: "রাজ্য",
    statePlaceholder: "আপনার রাজ্য লিখুন",
    district: "জেলা",
    districtPlaceholder: "আপনার জেলা লিখুন",
    continue: "এগিয়ে যান",
    saving: "সংরক্ষণ করা হচ্ছে...",
  },

  gu: {
    title: "તમારા ખેતર વિશે જણાવો",
    subtitle: "KrishiSahayak ને તમારા માટે વ્યક્તિગત બનાવવા થોડી માહિતી આપો.",
    name: "તમારું નામ",
    namePlaceholder: "તમારું નામ દાખલ કરો",
    land: "તમે કેટલી જમીનમાં ખેતી કરો છો?",
    landPlaceholder: "જમીનનું ક્ષેત્રફળ",
    unit: "એકમ",
    crop: "તમારો મુખ્ય પાક કયો છે?",
    cropPlaceholder: "દા.ત. ઘઉં, ચોખા, ટામેટા",
    state: "રાજ્ય",
    statePlaceholder: "તમારું રાજ્ય દાખલ કરો",
    district: "જિલ્લો",
    districtPlaceholder: "તમારો જિલ્લો દાખલ કરો",
    continue: "આગળ વધો",
    saving: "સાચવી રહ્યું છે...",
  },

  pa: {
    title: "ਆਪਣੇ ਖੇਤ ਬਾਰੇ ਦੱਸੋ",
    subtitle: "KrishiSahayak ਨੂੰ ਤੁਹਾਡੇ ਲਈ ਵਿਅਕਤੀਗਤ ਬਣਾਉਣ ਲਈ ਕੁਝ ਜਾਣਕਾਰੀ ਦਿਓ।",
    name: "ਤੁਹਾਡਾ ਨਾਮ",
    namePlaceholder: "ਆਪਣਾ ਨਾਮ ਦਰਜ ਕਰੋ",
    land: "ਤੁਸੀਂ ਕਿੰਨੀ ਜ਼ਮੀਨ 'ਤੇ ਖੇਤੀ ਕਰਦੇ ਹੋ?",
    landPlaceholder: "ਜ਼ਮੀਨ ਦਾ ਖੇਤਰਫਲ",
    unit: "ਇਕਾਈ",
    crop: "ਤੁਹਾਡੀ ਮੁੱਖ ਫਸਲ ਕਿਹੜੀ ਹੈ?",
    cropPlaceholder: "ਜਿਵੇਂ ਕਣਕ, ਚੌਲ, ਟਮਾਟਰ",
    state: "ਰਾਜ",
    statePlaceholder: "ਆਪਣਾ ਰਾਜ ਦਰਜ ਕਰੋ",
    district: "ਜ਼ਿਲ੍ਹਾ",
    districtPlaceholder: "ਆਪਣਾ ਜ਼ਿਲ੍ਹਾ ਦਰਜ ਕਰੋ",
    continue: "ਜਾਰੀ ਰੱਖੋ",
    saving: "ਸੰਭਾਲਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
  },

  kn: {
    title: "ನಿಮ್ಮ ಜಮೀನಿನ ಬಗ್ಗೆ ತಿಳಿಸಿ",
    subtitle: "KrishiSahayak ಅನ್ನು ನಿಮಗಾಗಿ ವೈಯಕ್ತೀಕರಿಸಲು ಕೆಲವು ಮಾಹಿತಿಯನ್ನು ನೀಡಿ.",
    name: "ನಿಮ್ಮ ಹೆಸರು",
    namePlaceholder: "ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
    land: "ನೀವು ಎಷ್ಟು ಜಮೀನಿನಲ್ಲಿ ಕೃಷಿ ಮಾಡುತ್ತೀರಿ?",
    landPlaceholder: "ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ",
    unit: "ಘಟಕ",
    crop: "ನಿಮ್ಮ ಮುಖ್ಯ ಬೆಳೆ ಯಾವುದು?",
    cropPlaceholder: "ಉದಾ. ಗೋಧಿ, ಅಕ್ಕಿ, ಟೊಮೆಟೊ",
    state: "ರಾಜ್ಯ",
    statePlaceholder: "ನಿಮ್ಮ ರಾಜ್ಯವನ್ನು ನಮೂದಿಸಿ",
    district: "ಜಿಲ್ಲೆ",
    districtPlaceholder: "ನಿಮ್ಮ ಜಿಲ್ಲೆಯನ್ನು ನಮೂದಿಸಿ",
    continue: "ಮುಂದುವರಿಸಿ",
    saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
  },

  ml: {
    title: "നിങ്ങളുടെ കൃഷിയിടത്തെക്കുറിച്ച് പറയൂ",
    subtitle: "KrishiSahayak നിങ്ങൾക്കായി വ്യക്തിഗതമാക്കാൻ കുറച്ച് വിവരങ്ങൾ നൽകൂ.",
    name: "നിങ്ങളുടെ പേര്",
    namePlaceholder: "നിങ്ങളുടെ പേര് നൽകുക",
    land: "നിങ്ങൾ എത്ര ഭൂമിയിലാണ് കൃഷി ചെയ്യുന്നത്?",
    landPlaceholder: "ഭൂമിയുടെ വിസ്തീർണ്ണം",
    unit: "യൂണിറ്റ്",
    crop: "നിങ്ങളുടെ പ്രധാന വിള ഏതാണ്?",
    cropPlaceholder: "ഉദാ. ഗോതമ്പ്, നെല്ല്, തക്കാളി",
    state: "സംസ്ഥാനം",
    statePlaceholder: "സംസ്ഥാനം നൽകുക",
    district: "ജില്ല",
    districtPlaceholder: "ജില്ല നൽകുക",
    continue: "തുടരുക",
    saving: "സംരക്ഷിക്കുന്നു...",
  },

  or: {
    title: "ଆପଣଙ୍କ ଚାଷ ଜମି ବିଷୟରେ କୁହନ୍ତୁ",
    subtitle: "KrishiSahayak କୁ ଆପଣଙ୍କ ପାଇଁ ବ୍ୟକ୍ତିଗତ କରିବାକୁ କିଛି ତଥ୍ୟ ଦିଅନ୍ତୁ।",
    name: "ଆପଣଙ୍କ ନାମ",
    namePlaceholder: "ଆପଣଙ୍କ ନାମ ଲେଖନ୍ତୁ",
    land: "ଆପଣ କେତେ ଜମିରେ ଚାଷ କରନ୍ତି?",
    landPlaceholder: "ଜମିର ପରିମାଣ",
    unit: "ଏକକ",
    crop: "ଆପଣଙ୍କ ମୁଖ୍ୟ ଫସଲ କଣ?",
    cropPlaceholder: "ଯଥା ଗହମ, ଧାନ, ଟମାଟୋ",
    state: "ରାଜ୍ୟ",
    statePlaceholder: "ରାଜ୍ୟ ଲେଖନ୍ତୁ",
    district: "ଜିଲ୍ଲା",
    districtPlaceholder: "ଜିଲ୍ଲା ଲେଖନ୍ତୁ",
    continue: "ଆଗକୁ ବଢନ୍ତୁ",
    saving: "ସଂରକ୍ଷଣ ହେଉଛି...",
  },
};

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [language, setLanguage] = useState("hi");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("acre");
  const [crop, setCrop] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationStep, setLocationStep] = useState(false);
  const [farmId, setFarmId] = useState(null);

  const t = translations[language] || translations.en;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!area || Number(area) <= 0) {
      setError("Please enter your land area.");
      return;
    }

    if (!crop.trim()) {
      setError("Please enter your main crop.");
      return;
    }

    try {
      setLoading(true);

      console.log("AUTH USER:", user);
      console.log("AUTH USER ID:", user?.id);
      // 1. Create/update farmer profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            name: name.trim(),
            preferred_language: language,
            state: state.trim() || null,
            district: district.trim() || null,
          },
          {
            onConflict: "user_id",
          }
        );

      if (profileError) {
        throw profileError;
      }
      // 2. Create farm
      console.log("Current user:", user);
      console.log("Current user ID:", user?.id);

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

      // 3. Create main crop
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

      // 4. Save the newly created farm ID
      setFarmId(farm.id);

      // 5. Move to location permission step
      setLocationStep(true);

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };


  //Location permission
  const handleGetLocation = async () => {
    setError("");
    setLoading(true);

    try {
      const location = await getCurrentLocation();

      console.log("Farmer GPS location:", location);

      // Update the farm with GPS information
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

      // Mark onboarding as completed
      const { error: onboardingError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (onboardingError) {
        throw onboardingError;
      }

      // Go to dashboard
      navigate("/dashboard");

    } catch (err) {
      console.error("Location error:", err);

      let message = "Unable to get your location.";

      if (err.code === 1) {
        message =
          "Location permission was denied. You can allow it from your browser settings.";
      } else if (err.code === 2) {
        message =
          "Your location could not be determined. Please try again.";
      } else if (err.code === 3) {
        message =
          "Location request timed out. Please try again.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  //Location permission skip
  const handleSkipLocation = async () => {
    setError("");
    setLoading(true);

    try {
      if (!user) {
        throw new Error("You must be logged in.");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Could not find your profile.");
      }

      console.log("Profile after skipping location:", data);

      if (data.onboarding_completed !== true) {
        throw new Error("Onboarding status was not saved.");
      }

      navigate("/dashboard", { replace: true });

    } catch (err) {
      console.error("Skip location error:", err);
      setError(err.message || "Something went wrong.");
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
            Allow location access
          </h1>

          <p style={{ color: "#647067", marginBottom: 24 }}>
            Allow location access so we can provide information
            relevant to your farm.
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
            {loading ? "Getting location..." : "Allow Location"}
          </button>

          <button
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
              cursor: "pointer",
            }}
          >
            Skip for now
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
        <h1
          style={{
            color: "#0c3d2b",
            marginBottom: 8,
          }}
        >
          {t.title}
        </h1>

        <p style={{ color: "#647067", marginBottom: 24 }}>
          {t.subtitle}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Language */}
          <label style={{ display: "block", marginBottom: 8 }}>
            Preferred language
          </label>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={inputStyle}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} — {lang.english}
              </option>
            ))}
          </select>

          {/* Name */}
          <label style={{ display: "block", marginBottom: 8 }}>
            {t.name}
          </label>

          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
          />

          {/* Land */}
          <label style={{ display: "block", marginBottom: 8 }}>
            {t.land}
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              type="number"
              min="0"
              step="0.01"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder={t.landPlaceholder}
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
          <label style={{ display: "block", marginBottom: 8 }}>
            {t.crop}
          </label>

          <input
            style={inputStyle}
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder={t.cropPlaceholder}
          />

          {/* State */}
          <label style={{ display: "block", marginBottom: 8 }}>
            {t.state}
          </label>

          <input
            style={inputStyle}
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder={t.statePlaceholder}
          />

          {/* District */}
          <label style={{ display: "block", marginBottom: 8 }}>
            {t.district}
          </label>

          <input
            style={inputStyle}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder={t.districtPlaceholder}
          />

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
            {loading ? t.saving : t.continue}
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