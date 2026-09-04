import React, { useEffect, useState } from "react";
import { MapPin, Zap } from "lucide-react";

import Layout from "./Layout.jsx";
import { useLanguage } from "./context/LanguageContext";
import { translateText } from "./services/translation";

/* =========================================================
   MARKET DATA
========================================================= */

const prices = [
  {
    crop: "Tomato",
    variety: "Hybrid",
    nashik: "₹1,960",
    pune: "₹1,840",
    kolhapur: "₹1,720",
    solapur: "₹1,890",
    change: "↗ 12.4%",
    changeType: "up",
    best: "nashik",
  },
  {
    crop: "Onion",
    variety: "Red",
    nashik: "₹1,980",
    pune: "₹2,100",
    kolhapur: "₹2,240",
    solapur: "₹2,150",
    change: "↘ 3.2%",
    changeType: "down",
    best: "kolhapur",
  },
  {
    crop: "Cotton",
    variety: "Long Staple",
    nashik: "₹6,920",
    pune: "₹6,850",
    kolhapur: "₹6,780",
    solapur: "₹6,900",
    change: "↗ 5.8%",
    changeType: "up",
    best: "nashik",
  },
  {
    crop: "Wheat",
    variety: "Sharbati",
    nashik: "₹2,380",
    pune: "₹2,300",
    kolhapur: "₹2,260",
    solapur: "₹2,320",
    change: "— Stable",
    changeType: "stable",
    best: "nashik",
  },
  {
    crop: "Soybean",
    variety: "Yellow",
    nashik: "₹4,800",
    pune: "₹4,920",
    kolhapur: "₹4,750",
    solapur: "₹4,870",
    change: "↘ 1.1%",
    changeType: "down",
    best: "pune",
  },
];

const nearbyMandis = [
  {
    name: "Nashik APMC",
    distance: "8 km away",
  },
  {
    name: "Pune APMC",
    distance: "42 km away",
  },
  {
    name: "Igatpuri Mandi",
    distance: "25 km away",
  },
];

/* =========================================================
   ENGLISH SOURCE TEXT
========================================================= */

const TEXT = {
  pageTitle: "Mandi Market",
  heading: "Mandi Market Insights",
  live: "Live · Updated 15 min ago",

  todaysPrices: "Today's Prices (₹/Quintal)",
  maharashtra: "Maharashtra",

  cropHeader: "CROP",
  nashik: "NASHIK",
  pune: "PUNE",
  kolhapur: "KOLHAPUR",
  solapur: "SOLAPUR",
  change: "CHANGE",

  best: "Best",
  stable: "Stable",

  trend: "4-Week Price Trend",

  aiRecommendation: "AI Market Recommendation",

  sellToday: "Sell Today",
  recover: "Prices likely to recover",
  wait: "Wait 5–7 Days",

  nearby: "Nearby Mandis",
  open: "Open",
  kmAway: "km away",

  tomato: "Tomato",
  onion: "Onion",
  cotton: "Cotton",
  wheat: "Wheat",
  soybean: "Soybean",

  hybrid: "Hybrid",
  red: "Red",
  longStaple: "Long Staple",
  sharbati: "Sharbati",
  yellow: "Yellow",
};

/* =========================================================
   PROPER NAME TRANSLATIONS
========================================================= */

const LOCALIZED_NAMES = {
  hi: {
    Nashik: "नासिक",
    Pune: "पुणे",
    Kolhapur: "कोल्हापुर",
    Solapur: "सोलापुर",
    Maharashtra: "महाराष्ट्र",
    "Nashik APMC": "नासिक एपीएमसी",
    "Pune APMC": "पुणे एपीएमसी",
    "Igatpuri Mandi": "इगतपुरी मंडी",
  },

  mr: {
    Nashik: "नाशिक",
    Pune: "पुणे",
    Kolhapur: "कोल्हापूर",
    Solapur: "सोलापूर",
    Maharashtra: "महाराष्ट्र",
    "Nashik APMC": "नाशिक एपीएमसी",
    "Pune APMC": "पुणे एपीएमसी",
    "Igatpuri Mandi": "इगतपुरी मंडी",
  },

  bn: {
    Nashik: "নাসিক",
    Pune: "পুনে",
    Kolhapur: "কোলহাপুর",
    Solapur: "সোলাপুর",
    Maharashtra: "মহারাষ্ট্র",
    "Nashik APMC": "নাসিক এপিএমসি",
    "Pune APMC": "পুনে এপিএমসি",
    "Igatpuri Mandi": "ইগতপুরী মান্ডি",
  },

  ta: {
    Nashik: "நாசிக்",
    Pune: "புனே",
    Kolhapur: "கோலாப்பூர்",
    Solapur: "சோலாப்பூர்",
    Maharashtra: "மகாராஷ்டிரா",
    "Nashik APMC": "நாசிக் ஏபிஎம்சி",
    "Pune APMC": "புனே ஏபிஎம்சி",
    "Igatpuri Mandi": "இகத்புரி மண்டி",
  },

  te: {
    Nashik: "నాసిక్",
    Pune: "పూణే",
    Kolhapur: "కొల్హాపూర్",
    Solapur: "సోలాపూర్",
    Maharashtra: "మహారాష్ట్ర",
    "Nashik APMC": "నాసిక్ ఏపీఎంసీ",
    "Pune APMC": "పూణే ఏపీఎంసీ",
    "Igatpuri Mandi": "ఇగత్పురి మార్కెట్",
  },

  kn: {
    Nashik: "ನಾಸಿಕ್",
    Pune: "ಪುಣೆ",
    Kolhapur: "ಕೊಲ್ಹಾಪುರ",
    Solapur: "ಸೋಲಾಪುರ",
    Maharashtra: "ಮಹಾರಾಷ್ಟ್ರ",
    "Nashik APMC": "ನಾಸಿಕ್ ಎಪಿಎಂಸಿ",
    "Pune APMC": "ಪುಣೆ ಎಪಿಎಂಸಿ",
    "Igatpuri Mandi": "ಇಗತ್ಪುರಿ ಮಂಡಿ",
  },

  ml: {
    Nashik: "നാസിക്",
    Pune: "പൂനെ",
    Kolhapur: "കോലാപ്പൂർ",
    Solapur: "സോലാപൂർ",
    Maharashtra: "മഹാരാഷ്ട്ര",
    "Nashik APMC": "നാസിക് എപിഎംസി",
    "Pune APMC": "പൂനെ എപിഎംസി",
    "Igatpuri Mandi": "ഇഗത്പുരി മണ്ടി",
  },

  gu: {
    Nashik: "નાશિક",
    Pune: "પુણે",
    Kolhapur: "કોલ્હાપુર",
    Solapur: "સોલાપુર",
    Maharashtra: "મહારાષ્ટ્ર",
    "Nashik APMC": "નાશિક એપીએમસી",
    "Pune APMC": "પુણે એપીએમસી",
    "Igatpuri Mandi": "ઇગતપુરી મંડી",
  },

  pa: {
    Nashik: "ਨਾਸਿਕ",
    Pune: "ਪੁਣੇ",
    Kolhapur: "ਕੋਲ੍ਹਾਪੁਰ",
    Solapur: "ਸੋਲਾਪੁਰ",
    Maharashtra: "ਮਹਾਰਾਸ਼ਟਰ",
    "Nashik APMC": "ਨਾਸਿਕ ਏਪੀਐਮਸੀ",
    "Pune APMC": "ਪੁਣੇ ਏਪੀਐਮਸੀ",
    "Igatpuri Mandi": "ਇਗਤਪੁਰੀ ਮੰਡੀ",
  },

  or: {
    Nashik: "ନାସିକ",
    Pune: "ପୁଣେ",
    Kolhapur: "କୋଲହାପୁର",
    Solapur: "ସୋଲାପୁର",
    Maharashtra: "ମହାରାଷ୍ଟ୍ର",
    "Nashik APMC": "ନାସିକ ଏପିଏମସି",
    "Pune APMC": "ପୁଣେ ଏପିଏମସି",
    "Igatpuri Mandi": "ଇଗତପୁରୀ ମଣ୍ଡି",
  },
};

/* =========================================================
   FIXED TRANSLATIONS
   IMPORTANT:
   These two are NOT sent through MyMemory because it was
   returning incorrect translations for "Best".
========================================================= */

const FIXED_TRANSLATIONS = {
  hi: {
    todaysPrices: "आज के भाव (₹/क्विंटल)",
    best: "सर्वोत्तम मूल्य",
  },

  mr: {
    todaysPrices: "आजचे बाजारभाव (₹/क्विंटल)",
    best: "सर्वोत्तम बाजारभाव",
  },

  bn: {
    todaysPrices: "আজকের দাম (₹/কুইন্টাল)",
    best: "সেরা বাজারদর",
  },

  ta: {
    todaysPrices: "இன்றைய விலைகள் (₹/குவிண்டால்)",
    best: "சிறந்த சந்தை விலை",
  },

  te: {
    todaysPrices: "నేటి ధరలు (₹/క్వింటాల్)",
    best: "ఉత్తమ మార్కెట్ ధర",
  },

  kn: {
    todaysPrices: "ಇಂದಿನ ಬೆಲೆಗಳು (₹/ಕ್ವಿಂಟಾಲ್)",
    best: "ಅತ್ಯುತ್ತಮ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ",
  },

  ml: {
    todaysPrices: "ഇന്നത്തെ വിലകൾ (₹/ക്വിന്റൽ)",
    best: "മികച്ച വിപണി വില",
  },

  gu: {
    todaysPrices: "આજના ભાવ (₹/ક્વિન્ટલ)",
    best: "શ્રેષ્ઠ બજાર ભાવ",
  },

  pa: {
    todaysPrices: "ਅੱਜ ਦੇ ਭਾਅ (₹/ਕੁਇੰਟਲ)",
    best: "ਸਭ ਤੋਂ ਵਧੀਆ ਮੰਡੀ ਭਾਅ",
  },

  or: {
    todaysPrices: "ଆଜିର ମୂଲ୍ୟ (₹/କ୍ୱିଣ୍ଟାଲ)",
    best: "ସର୍ବୋତ୍ତମ ବଜାର ମୂଲ୍ୟ",
  },
};

/* =========================================================
   COMPONENT
========================================================= */

export default function MandiMarketPage() {
  const { language } = useLanguage();

  const [translations, setTranslations] = useState({});
  const [loadingTranslation, setLoadingTranslation] =
    useState(false);

  /* =======================================================
     TRANSLATION
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function translatePage() {
      /* English */
      if (!language || language === "en") {
        setTranslations(TEXT);
        setLoadingTranslation(false);
        return;
      }

      setLoadingTranslation(true);

      const translated = {};

      /*
       * Translate normal UI strings using the existing
       * translation service.
       */
      for (const [key, value] of Object.entries(TEXT)) {
        if (cancelled) return;

        /*
         * These two are handled manually below.
         * Do not send them to MyMemory.
         */
        if (
          key === "todaysPrices" ||
          key === "best"
        ) {
          continue;
        }

        try {
          const result = await translateText(
            value,
            language,
            "en"
          );

          translated[key] =
            result && result.trim()
              ? result
              : value;
        } catch (error) {
          console.error(
            `Mandi translation failed: ${value}`,
            error
          );

          translated[key] = value;
        }
      }

      /* ===================================================
         PROPER NAMES
      =================================================== */

      const names = LOCALIZED_NAMES[language];

      if (names) {
        translated.nashik =
          names.Nashik || TEXT.nashik;

        translated.pune =
          names.Pune || TEXT.pune;

        translated.kolhapur =
          names.Kolhapur || TEXT.kolhapur;

        translated.solapur =
          names.Solapur || TEXT.solapur;

        translated.maharashtra =
          names.Maharashtra || TEXT.maharashtra;
      }

      /* ===================================================
         FIXED STRINGS
      =================================================== */

      const fixed = FIXED_TRANSLATIONS[language];

      if (fixed) {
        translated.todaysPrices =
          fixed.todaysPrices;

        translated.best =
          fixed.best;
      } else {
        /*
         * Fallback for a language not in our fixed map.
         */
        try {
          translated.todaysPrices =
            await translateText(
              TEXT.todaysPrices,
              language,
              "en"
            );
        } catch {
          translated.todaysPrices =
            TEXT.todaysPrices;
        }

        try {
          translated.best =
            await translateText(
              TEXT.best,
              language,
              "en"
            );
        } catch {
          translated.best = TEXT.best;
        }
      }

      /* ===================================================
         SAVE
      =================================================== */

      if (!cancelled) {
        setTranslations(translated);
        setLoadingTranslation(false);
      }
    }

    translatePage();

    return () => {
      cancelled = true;
    };
  }, [language]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const t = (key) => {
    return translations[key] || TEXT[key] || key;
  };

  const translateCrop = (crop) => {
    const map = {
      Tomato: "tomato",
      Onion: "onion",
      Cotton: "cotton",
      Wheat: "wheat",
      Soybean: "soybean",
    };

    return t(map[crop] || crop);
  };

  const translateVariety = (variety) => {
    const map = {
      Hybrid: "hybrid",
      Red: "red",
      "Long Staple": "longStaple",
      Sharbati: "sharbati",
      Yellow: "yellow",
    };

    return t(map[variety] || variety);
  };

  const getMandiName = (name) => {
    if (language === "en") {
      return name;
    }

    const localized = LOCALIZED_NAMES[language];

    if (localized?.[name]) {
      return localized[name];
    }

    return name;
  };

  const getDistance = (distance) => {
    if (language === "en") {
      return distance;
    }

    const match = distance.match(/^(\d+)\s+km away$/);

    if (!match) {
      return distance;
    }

    return `${match[1]} ${t("kmAway")}`;
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Layout title={t("pageTitle")}>

      <div className="space-y-6">

        {/* =================================================
            PAGE HEADING
        ================================================= */}

        <div className="flex items-center justify-between">

          <h1 className="font-serif text-2xl font-bold text-[#20291f]">
            {t("heading")}
          </h1>

          <div className="flex items-center gap-2 text-sm text-slate-500">

            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

            {t("live")}

          </div>

        </div>


        {/* =================================================
            TODAY'S PRICES
        ================================================= */}

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#e5dfd2]">

          <div className="flex items-center justify-between border-b border-[#e5dfd2] px-5 py-5">

            <h2 className="font-serif text-lg font-bold text-[#24352a]">
              {t("todaysPrices")}
            </h2>

            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">

              <MapPin size={18} />

              {t("maharashtra")}

            </div>

          </div>


          {/* =================================================
              TABLE HEADER
          ================================================= */}

          <div className="grid grid-cols-[1.7fr_repeat(4,1.2fr)_1fr] bg-[#f5f3ee] px-5 py-4 text-sm font-bold text-slate-500">

            <div>
              {t("cropHeader")}
            </div>

            <div>
              {t("nashik")}
            </div>

            <div>
              {t("pune")}
            </div>

            <div>
              {t("kolhapur")}
            </div>

            <div>
              {t("solapur")}
            </div>

            <div>
              {t("change")}
            </div>

          </div>


          {/* =================================================
              TABLE ROWS
          ================================================= */}

          {prices.map((item) => (

            <div
              key={item.crop}
              className="grid grid-cols-[1.7fr_repeat(4,1.2fr)_1fr] items-center border-b border-[#e5dfd2] px-5 py-5 last:border-b-0"
            >

              {/* Crop */}

              <div>

                <p className="font-serif text-lg font-bold text-[#24352a]">
                  {translateCrop(item.crop)}
                </p>

                <p className="text-sm text-slate-500">
                  {translateVariety(item.variety)}
                </p>

              </div>


              {/* Nashik */}

              <PriceCell
                price={item.nashik}
                best={item.best === "nashik"}
                bestText={t("best")}
              />


              {/* Pune */}

              <PriceCell
                price={item.pune}
                best={item.best === "pune"}
                bestText={t("best")}
              />


              {/* Kolhapur */}

              <PriceCell
                price={item.kolhapur}
                best={item.best === "kolhapur"}
                bestText={t("best")}
              />


              {/* Solapur */}

              <PriceCell
                price={item.solapur}
                best={item.best === "solapur"}
                bestText={t("best")}
              />


              {/* Change */}

              <div>

                <span
                  className={`inline-flex min-w-[105px] justify-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
                    item.changeType === "up"
                      ? "bg-green-100 text-green-700"
                      : item.changeType === "down"
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >

                  {item.changeType === "stable"
                    ? `— ${t("stable")}`
                    : item.change}

                </span>

              </div>

            </div>

          ))}

        </div>


        {/* =================================================
            BOTTOM SECTION
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">


          {/* =================================================
              PRICE TREND
          ================================================= */}

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <div className="flex items-center justify-between">

              <h2 className="font-serif text-lg font-bold text-[#24352a]">
                {t("trend")}
              </h2>

              <select
                className="rounded-full border-0 bg-[#ebe8e1] px-4 py-2 text-sm font-medium text-[#24352a] outline-none"
                defaultValue="Tomato"
              >

                <option value="Tomato">
                  {translateCrop("Tomato")}
                </option>

                <option value="Onion">
                  {translateCrop("Onion")}
                </option>

                <option value="Cotton">
                  {translateCrop("Cotton")}
                </option>

                <option value="Wheat">
                  {translateCrop("Wheat")}
                </option>

              </select>

            </div>


            {/* Legend */}

            <div className="mt-4 flex gap-5 text-sm text-slate-500">

              <div className="flex items-center gap-2">

                <span className="h-3 w-3 rounded-full bg-[#2f7357]" />

                {translateCrop("Tomato")}

              </div>


              <div className="flex items-center gap-2">

                <span className="h-3 w-3 rounded-full bg-orange-400" />

                {translateCrop("Onion")}

              </div>


              <div className="flex items-center gap-2">

                <span className="h-3 w-3 rounded-full bg-blue-500" />

                {translateCrop("Cotton")}

              </div>

            </div>


            {/* Chart */}

            <div className="relative mt-5 h-[230px] w-full">

              <div className="absolute left-8 right-2 top-5 border-t border-slate-100" />
              <div className="absolute left-8 right-2 top-[75px] border-t border-slate-100" />
              <div className="absolute left-8 right-2 top-[130px] border-t border-slate-100" />
              <div className="absolute left-8 right-2 top-[185px] border-t border-slate-100" />

              <div className="absolute left-0 top-1 text-xs text-slate-500">
                8000
              </div>

              <div className="absolute left-0 top-[57px] text-xs text-slate-500">
                6000
              </div>

              <div className="absolute left-0 top-[112px] text-xs text-slate-500">
                4000
              </div>

              <div className="absolute left-0 top-[167px] text-xs text-slate-500">
                2000
              </div>

              <div className="absolute bottom-0 left-4 text-xs text-slate-500">
                0
              </div>


              <svg
                viewBox="0 0 700 220"
                className="absolute left-8 right-0 top-0 h-[210px] w-[calc(100%-32px)]"
                preserveAspectRatio="none"
              >

                <polyline
                  points="20,175 235,165 450,160 665,145"
                  fill="none"
                  stroke="#2f7357"
                  strokeWidth="3"
                />

                <polyline
                  points="20,115 235,117 450,120 665,123"
                  fill="none"
                  stroke="#f4a261"
                  strokeWidth="3"
                />

                <polyline
                  points="20,40 235,38 450,36 665,33"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />

                <circle
                  cx="20"
                  cy="175"
                  r="5"
                  fill="#2f7357"
                />

                <circle
                  cx="235"
                  cy="165"
                  r="5"
                  fill="#2f7357"
                />

                <circle
                  cx="450"
                  cy="160"
                  r="5"
                  fill="#2f7357"
                />

                <circle
                  cx="665"
                  cy="145"
                  r="5"
                  fill="#2f7357"
                />

                <circle
                  cx="20"
                  cy="115"
                  r="5"
                  fill="#f4a261"
                />

                <circle
                  cx="235"
                  cy="117"
                  r="5"
                  fill="#f4a261"
                />

                <circle
                  cx="450"
                  cy="120"
                  r="5"
                  fill="#f4a261"
                />

                <circle
                  cx="665"
                  cy="123"
                  r="5"
                  fill="#f4a261"
                />

                <circle
                  cx="20"
                  cy="40"
                  r="5"
                  fill="#3b82f6"
                />

                <circle
                  cx="235"
                  cy="38"
                  r="5"
                  fill="#3b82f6"
                />

                <circle
                  cx="450"
                  cy="36"
                  r="5"
                  fill="#3b82f6"
                />

                <circle
                  cx="665"
                  cy="33"
                  r="5"
                  fill="#3b82f6"
                />

              </svg>


              <div className="absolute bottom-0 left-[7%] text-xs text-slate-500">
                W1
              </div>

              <div className="absolute bottom-0 left-[38%] text-xs text-slate-500">
                W2
              </div>

              <div className="absolute bottom-0 left-[68%] text-xs text-slate-500">
                W3
              </div>

              <div className="absolute bottom-0 right-[1%] text-xs text-slate-500">
                W4
              </div>

            </div>

          </div>


          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <div className="space-y-5">


            {/* =================================================
                AI RECOMMENDATION
            ================================================= */}

            <div className="rounded-3xl bg-[#2f7357] p-5">

              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-white">

                <Zap
                  size={20}
                  className="text-yellow-300"
                  fill="currentColor"
                />

                {t("aiRecommendation")}

              </h2>


              <div className="mt-4 space-y-3">

                <Recommendation
                  icon="🍅"
                  crop={translateCrop("Tomato")}
                  description={`${getMandiName(
                    "Nashik"
                  )} · ₹1,960/Q`}
                  action={t("sellToday")}
                  actionClass="bg-green-500"
                />


                <Recommendation
                  icon="🧅"
                  crop={translateCrop("Onion")}
                  description={t("recover")}
                  action={t("wait")}
                  actionClass="bg-yellow-500"
                />


                <Recommendation
                  icon="🌾"
                  crop={translateCrop("Cotton")}
                  description={`${getMandiName(
                    "Nashik"
                  )} · ₹6,920/Q`}
                  action={t("sellToday")}
                  actionClass="bg-green-500"
                />

              </div>

            </div>


            {/* =================================================
                NEARBY MANDIS
            ================================================= */}

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

              <h2 className="font-serif text-lg font-bold text-[#24352a]">
                {t("nearby")}
              </h2>


              <div className="mt-3">

                {nearbyMandis.map((mandi) => (

                  <div
                    key={mandi.name}
                    className="flex items-center justify-between border-b border-[#e5dfd2] py-4 last:border-b-0"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff3df] text-[#2f7357]">

                        <MapPin size={19} />

                      </div>


                      <div>

                        <p className="font-medium text-[#24352a]">
                          {getMandiName(mandi.name)}
                        </p>

                        <p className="text-sm text-slate-500">
                          {getDistance(mandi.distance)}
                        </p>

                      </div>

                    </div>


                    <span className="whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      {t("open")}
                    </span>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            TRANSLATION STATUS
        ================================================= */}

        {loadingTranslation && language !== "en" && (
          <div className="text-center text-xs text-slate-400">
            Translating...
          </div>
        )}

      </div>

    </Layout>
  );
}


/* =========================================================
   PRICE CELL
========================================================= */

function PriceCell({
  price,
  best,
  bestText,
}) {
  return (
    <div className="flex items-center gap-2">

      <span
        className={`text-lg font-bold ${
          best
            ? "text-[#2f7357]"
            : "text-[#20291f]"
        }`}
      >
        {price}
      </span>


      {best && (
        <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
          {bestText}
        </span>
      )}

    </div>
  );
}


/* =========================================================
   RECOMMENDATION CARD
========================================================= */

function Recommendation({
  icon,
  crop,
  description,
  action,
  actionClass,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#438063] px-4 py-3">

      <div className="flex items-center gap-3">

        <span className="text-2xl">
          {icon}
        </span>

        <div>

          <p className="font-bold text-white">
            {crop}
          </p>

          <p className="text-sm text-green-100">
            {description}
          </p>

        </div>

      </div>


      <button
        className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white ${actionClass}`}
      >
        {action}
      </button>

    </div>
  );
}