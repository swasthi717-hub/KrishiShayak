import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapPin,
  TrendingUp,
  RefreshCw,
  Zap,
} from "lucide-react";

import Layout from "./Layout.jsx";

import {
  getMandiPrices,
} from "./services/mandiApi.js";

import { supabase } from "./lib/supabase";

import { useAuth } from "./context/AuthContext";

import { useLanguage } from "./context/LanguageContext";

import {
  translateText,
} from "./services/translation";

/* =========================================================
   MARKET DATA / UI SOURCE TEXT
   ========================================================= */

const TEXT = {
  pageTitle: "Mandi Market",
  heading: "Mandi Market Insights",
  live: "Live · Updated 15 min ago",
  todaysPrices: "Today's Prices (₹/Quintal)",
  cropHeader: "CROP",
  change: "CHANGE",
  best: "Best",
  stable: "Stable",
  trend: "4-Week Price Trend",
  aiRecommendation: "AI Market Recommendation",
  sellToday: "Sell Today",
  recover: "Prices likely to recover",
  wait: "Wait 5–7 Days",
  nearby: "Available Mandis",
  open: "Available",
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

  marketPriceComparison:
    "Market Price Comparison",

  compareCurrent:
    "Compare current",

  pricesAcross:
    "prices across available markets",

  noMarketPrices:
    "No market prices available for this crop.",

  liveMarketData:
    "Live market data",

  liveMarketDataDescription:
    "Prices shown here are based on the latest mandi records returned by the government data API. The comparison uses modal prices.",

  marketInsight:
    "Market Insight",

  bestCurrentPrice:
    "Best current price for",

  highest:
    "Highest",

  comparisonDisclaimer:
    "This is a price comparison based on the current API data. Actual selling decisions should also consider transport, quality, demand and local market conditions.",

  noRecommendation:
    "No recommendation can be generated because there is not enough current price data.",

  availableMarkets:
    "Available Mandis",

  marketsReturned:
    "Markets returned by the live API",

  locationPrices:
    "Prices for your location",

  basedOnOnboarding:
    "based on the location you provided during onboarding.",

  loadingLivePrices:
    "Fetching live mandi prices...",

  gettingLatest:
    "Getting the latest data from data.gov.in",

  noData:
    "No mandi data available",

  noMatchingRecords:
    "No matching mandi records were found for your location. Try refreshing the data later.",

  refresh:
    "Refresh",

  crop:
    "Crop",

  modelUnavailable:
    "No crop-specific market data is available right now.",
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
  const { user } = useAuth();

  const { language } = useLanguage();

  const [records, setRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedCrop, setSelectedCrop] =
    useState("");

  const [
    farmerLocation,
    setFarmerLocation,
  ] = useState({
    state: "",
    district: "",
  });

  const [
    locationLoading,
    setLocationLoading,
  ] = useState(true);

  const [
    translations,
    setTranslations,
  ] = useState(TEXT);

  const [
    loadingTranslation,
    setLoadingTranslation,
  ] = useState(false);

  /* =======================================================
     TRANSLATION
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function translatePage() {
      if (
        !language ||
        language === "en"
      ) {
        setTranslations(TEXT);
        setLoadingTranslation(false);
        return;
      }

      setLoadingTranslation(true);

      const translated = {};

      for (const [
        key,
        value,
      ] of Object.entries(TEXT)) {
        if (cancelled) {
          return;
        }

        if (
          key === "todaysPrices" ||
          key === "best"
        ) {
          continue;
        }

        try {
          const result =
            await translateText(
              value,
              language,
              "en"
            );

          translated[key] =
            result &&
            result.trim()
              ? result
              : value;
        } catch (translationError) {
          console.error(
            `Mandi translation failed: ${value}`,
            translationError
          );

          translated[key] = value;
        }
      }

      /* -----------------------------------------------------
         Proper place names
         ----------------------------------------------------- */

      const names =
        LOCALIZED_NAMES[language];

      if (names) {
        translated.todaysPrices =
          TEXT.todaysPrices;

        translated.best =
          names.Best ||
          TEXT.best;
      }

      /* -----------------------------------------------------
         Fixed translations
         ----------------------------------------------------- */

      const fixed =
        FIXED_TRANSLATIONS[
          language
        ];

      if (fixed) {
        translated.todaysPrices =
          fixed.todaysPrices;

        translated.best =
          fixed.best;
      } else {
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
          translated.best =
            TEXT.best;
        }
      }

      if (!cancelled) {
        setTranslations(
          translated
        );

        setLoadingTranslation(false);
      }
    }

    translatePage();

    return () => {
      cancelled = true;
    };
  }, [language]);

  /* =======================================================
     TRANSLATION HELPERS
     ======================================================= */

  const t = (key) =>
    translations[key] ||
    TEXT[key] ||
    key;

  const translateCrop = (
    crop
  ) => {
    const map = {
      Tomato: "tomato",
      Onion: "onion",
      Cotton: "cotton",
      Wheat: "wheat",
      Soybean: "soybean",
    };

    return t(
      map[crop] || crop
    );
  };

  const translateVariety = (
    variety
  ) => {
    const map = {
      Hybrid: "hybrid",
      Red: "red",
      "Long Staple":
        "longStaple",
      Sharbati: "sharbati",
      Yellow: "yellow",
    };

    return t(
      map[variety] ||
        variety
    );
  };

  const getMandiName = (
    name
  ) => {
    if (
      !language ||
      language === "en"
    ) {
      return name;
    }

    const localized =
      LOCALIZED_NAMES[
        language
      ];

    return (
      localized?.[name] ||
      name
    );
  };

  /* =======================================================
     LOAD ONBOARDING LOCATION
     ======================================================= */

  const loadFarmerLocation =
    async () => {
      try {
        setLocationLoading(
          true
        );

        setError("");

        if (!user?.id) {
          throw new Error(
            "User is not logged in."
          );
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "state, district"
          )
          .eq(
            "user_id",
            user.id
          )
          .single();

        if (profileError) {
          throw profileError;
        }

        const location = {
          state:
            profile?.state ||
            "",
          district:
            profile?.district ||
            "",
        };

        setFarmerLocation(
          location
        );

        return location;
      } catch (err) {
        console.error(
          "Failed to load farmer location:",
          err
        );

        setFarmerLocation({
          state: "",
          district: "",
        });

        setError(
          "Unable to load your farm location. Please check your onboarding details."
        );

        return {
          state: "",
          district: "",
        };
      } finally {
        setLocationLoading(
          false
        );
      }
    };

  /* =======================================================
     FETCH MANDI PRICES
     ======================================================= */

  const fetchPrices =
    async () => {
      try {
        setLoading(true);
        setError("");

        if (!user?.id) {
          setError(
            "You must be logged in."
          );
          return;
        }

        const location =
          await loadFarmerLocation();

        if (
          !location.state &&
          !location.district
        ) {
          setRecords([]);

          setError(
            "Your state and district are not available. Please complete your onboarding details."
          );

          return;
        }

        console.log(
          "Fetching mandi prices for onboarding location:",
          location
        );

        /* ---------------------------------------------------
           First: state + district
           --------------------------------------------------- */

        let data =
          await getMandiPrices({
            state:
              location.state,
            district:
              location.district,
            limit: 50,
            offset: 0,
          });

        let fetchedRecords =
          data?.records || [];

        /* ---------------------------------------------------
           Fallback: state only
           --------------------------------------------------- */

        if (
          fetchedRecords.length ===
            0 &&
          location.state
        ) {
          console.log(
            "No district records found. Trying state only."
          );

          data =
            await getMandiPrices({
              state:
                location.state,
              limit: 50,
              offset: 0,
            });

          fetchedRecords =
            data?.records || [];
        }

        setRecords(
          fetchedRecords
        );

        if (
          fetchedRecords.length >
          0
        ) {
          setSelectedCrop(
            fetchedRecords[0]
              .Commodity ||
              fetchedRecords[0]
                .commodity ||
              ""
          );
        } else {
          setSelectedCrop("");
        }
      } catch (err) {
        console.error(
          "Mandi page error:",
          err
        );

        setRecords([]);

        setError(
          err?.message ||
            "Unable to load mandi prices. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    if (user?.id) {
      fetchPrices();
    }
  }, [user?.id]);

  /* =======================================================
     NORMALIZE API RECORDS
     ======================================================= */

  const normalizedRecords =
    useMemo(() => {
      return records.map(
        (item) => ({
          state:
            item.State ||
            item.state ||
            "",

          district:
            item.District ||
            item.district ||
            "",

          market:
            item.Market ||
            item.market ||
            "",

          commodity:
            item.Commodity ||
            item.commodity ||
            "",

          variety:
            item.Variety ||
            item.variety ||
            "",

          grade:
            item.Grade ||
            item.grade ||
            "",

          arrivalDate:
            item.Arrival_Date ||
            item.arrival_date ||
            item["Arrival Date"] ||
            "",

          minPrice:
            Number(
              item.Min_Price ||
                item.min_price ||
                item["Min Price"] ||
                0
            ),

          maxPrice:
            Number(
              item.Max_Price ||
                item.max_price ||
                item["Max Price"] ||
                0
            ),

          modalPrice:
            Number(
              item.Modal_Price ||
                item.modal_price ||
                item["Modal Price"] ||
                0
            ),
        })
      );
    }, [records]);

  /* =======================================================
     UNIQUE CROPS
     ======================================================= */

  const crops =
    useMemo(() => {
      return [
        ...new Set(
          normalizedRecords
            .map(
              (item) =>
                item.commodity
            )
            .filter(Boolean)
        ),
      ];
    }, [normalizedRecords]);

  /* =======================================================
     SELECTED CROP RECORDS
     ======================================================= */

  const selectedCropRecords =
    useMemo(() => {
      if (!selectedCrop) {
        return [];
      }

      return normalizedRecords.filter(
        (item) =>
          item.commodity
            .toLowerCase() ===
          selectedCrop.toLowerCase()
      );
    }, [
      normalizedRecords,
      selectedCrop,
    ]);

  /* =======================================================
     UNIQUE MARKETS
     ======================================================= */

  const markets =
    useMemo(() => {
      return [
        ...new Set(
          normalizedRecords
            .map(
              (item) =>
                item.market
            )
            .filter(Boolean)
        ),
      ].slice(0, 6);
    }, [normalizedRecords]);

  /* =======================================================
     TABLE DATA
     Groups records by commodity + variety
     ======================================================= */

  const priceRows =
    useMemo(() => {
      const grouped = {};

      normalizedRecords.forEach(
        (item) => {
          const key = `${item.commodity}-${item.variety}`;

          if (!grouped[key]) {
            grouped[key] = {
              commodity:
                item.commodity,

              variety:
                item.variety,

              markets: {},
            };
          }

          if (
            !grouped[key].markets[
              item.market
            ] ||
            item.modalPrice >
              grouped[key].markets[
                item.market
              ].modalPrice
          ) {
            grouped[key].markets[
              item.market
            ] = item;
          }
        }
      );

      return Object.values(
        grouped
      ).slice(0, 10);
    }, [normalizedRecords]);

  /* =======================================================
     BEST MARKET FOR ROW
     ======================================================= */

  const getBestMarket = (
    row
  ) => {
    let bestMarket = "";
    let bestPrice = 0;

    markets.forEach(
      (market) => {
        const record =
          row.markets[
            market
          ];

        if (
          record &&
          record.modalPrice >
            bestPrice
        ) {
          bestPrice =
            record.modalPrice;

          bestMarket =
            market;
        }
      }
    );

    return bestMarket;
  };

  /* =======================================================
     MARKET COMPARISON
     ======================================================= */

  const marketComparison =
    useMemo(() => {
      return markets
        .map((market) => {
          const recordsForMarket =
            selectedCropRecords.filter(
              (item) =>
                item.market.toLowerCase() ===
                market.toLowerCase()
            );

          if (
            !recordsForMarket.length
          ) {
            return null;
          }

          const prices =
            recordsForMarket
              .map(
                (item) =>
                  item.modalPrice
              )
              .filter(
                (price) =>
                  price > 0
              );

          if (!prices.length) {
            return null;
          }

          const average =
            prices.reduce(
              (
                sum,
                price
              ) =>
                sum + price,
              0
            ) /
            prices.length;

          return {
            market,
            price: average,
          };
        })
        .filter(Boolean);
    }, [
      markets,
      selectedCropRecords,
    ]);

  /* =======================================================
     BEST MARKET
     ======================================================= */

  const bestMarket =
    useMemo(() => {
      if (
        !marketComparison.length
      ) {
        return null;
      }

      return [
        ...marketComparison,
      ].sort(
        (a, b) =>
          b.price - a.price
      )[0];
    }, [marketComparison]);

  /* =======================================================
     LATEST DATE
     ======================================================= */

  const latestDate =
    useMemo(() => {
      const dates =
        normalizedRecords
          .map(
            (item) =>
              item.arrivalDate
          )
          .filter(Boolean);

      if (!dates.length) {
        return null;
      }

      return dates.sort()
        .reverse()[0];
    }, [normalizedRecords]);

  /* =======================================================
     FORMAT PRICE
     ======================================================= */

  const formatPrice = (
    price
  ) => {
    if (
      !price ||
      Number.isNaN(price)
    ) {
      return "—";
    }

    return `₹${Math.round(
      price
    ).toLocaleString(
      "en-IN"
    )}`;
  };

  /* =======================================================
     NOT LOGGED IN
     ======================================================= */

  if (!user) {
    return (
      <Layout
        title={t(
          "pageTitle"
        )}
      >
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-[#e5dfd2]">

          <p className="font-serif text-lg font-bold text-[#24352a]">
            Please log in
          </p>

          <p className="mt-2 text-sm text-slate-500">
            You need to be logged in to view
            mandi prices for your location.
          </p>

        </div>
      </Layout>
    );
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <Layout
      title={t(
        "pageTitle"
      )}
    >
      <div className="space-y-6">

        {/* =================================================
            PAGE HEADING
        ================================================= */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h1 className="font-serif text-2xl font-bold text-[#20291f]">
              {t("heading")}
            </h1>

            {!locationLoading &&
              (
                farmerLocation.state ||
                farmerLocation.district
              ) && (

                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">

                  <MapPin
                    size={15}
                    className="text-[#2f7357]"
                  />

                  <span>

                    {farmerLocation.district &&
                      `${farmerLocation.district}, `}

                    {farmerLocation.state}

                  </span>

                </div>

              )}

          </div>

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 text-sm text-slate-500">

              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

              {loading
                ? "Loading live prices..."
                : `Live · ${
                    latestDate
                      ? `Updated ${latestDate}`
                      : "Latest available data"
                  }`}

            </div>

            <button
              type="button"
              onClick={
                fetchPrices
              }
              disabled={
                loading ||
                locationLoading
              }
              className="flex items-center gap-2 rounded-full bg-[#2f7357] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#285f49] disabled:cursor-not-allowed disabled:opacity-60"
            >

              <RefreshCw
                size={15}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              {t("refresh")}

            </button>

          </div>

        </div>

        {/* =================================================
            LOCATION INFORMATION
        ================================================= */}

        {!locationLoading &&
          farmerLocation.state && (

            <div className="rounded-2xl bg-[#e7edda] px-5 py-4">

              <div className="flex items-start gap-3">

                <MapPin
                  size={20}
                  className="mt-0.5 shrink-0 text-[#2f7357]"
                />

                <div>

                  <p className="font-semibold text-[#24352a]">
                    {t(
                      "locationPrices"
                    )}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">

                    Showing mandi data for{" "}

                    <strong>

                      {farmerLocation.district
                        ? `${farmerLocation.district}, `
                        : ""}

                      {farmerLocation.state}

                    </strong>

                    ,{" "}
                    {t(
                      "basedOnOnboarding"
                    )}

                  </p>

                </div>

              </div>

            </div>

          )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>

        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {(loading ||
          locationLoading) && (

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-[#e5dfd2]">

            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-[#2f7357]"
            />

            <p className="mt-4 font-medium text-[#24352a]">
              {t(
                "loadingLivePrices"
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t(
                "gettingLatest"
              )}
            </p>

          </div>

        )}

        {/* =================================================
            NO DATA
        ================================================= */}

        {!loading &&
          !locationLoading &&
          !error &&
          normalizedRecords.length ===
            0 && (

            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-[#e5dfd2]">

              <p className="font-serif text-lg font-bold text-[#24352a]">
                {t("noData")}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {t(
                  "noMatchingRecords"
                )}
              </p>

            </div>

          )}

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        {!loading &&
          !locationLoading &&
          normalizedRecords.length >
            0 && (

            <>

              {/* =================================================
                  TODAY'S PRICES
              ================================================= */}

              <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#e5dfd2]">

                <div className="flex flex-col gap-3 border-b border-[#e5dfd2] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <h2 className="font-serif text-lg font-bold text-[#24352a]">
                      {t(
                        "todaysPrices"
                      )}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Modal prices from the latest
                      mandi records
                    </p>

                  </div>

                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">

                    <MapPin
                      size={18}
                    />

                    {farmerLocation.district
                      ? `${farmerLocation.district}, `
                      : ""}

                    {farmerLocation.state ||
                      "Your location"}

                  </div>

                </div>

                <div className="overflow-x-auto">

                  <div className="min-w-[900px]">

                    {/* TABLE HEADER */}

                    <div
                      className="grid bg-[#f5f3ee] px-5 py-4 text-sm font-bold text-slate-500"
                      style={{
                        gridTemplateColumns:
                          `1.7fr repeat(${markets.length}, 1.2fr) 1fr`,
                      }}
                    >

                      <div>
                        {t(
                          "cropHeader"
                        )}
                      </div>

                      {markets.map(
                        (market) => (

                          <div
                            key={
                              market
                            }
                          >
                            {getMandiName(
                              market
                            ).toUpperCase()}
                          </div>

                        )
                      )}

                      <div>
                        BEST MARKET
                      </div>

                    </div>

                    {/* TABLE ROWS */}

                    {priceRows.map(
                      (
                        item,
                        index
                      ) => {

                        const best =
                          getBestMarket(
                            item
                          );

                        return (
                          <div
                            key={`${item.commodity}-${item.variety}-${index}`}
                            className="grid items-center border-b border-[#e5dfd2] px-5 py-5 last:border-b-0"
                            style={{
                              gridTemplateColumns:
                                `1.7fr repeat(${markets.length}, 1.2fr) 1fr`,
                            }}
                          >

                            {/* CROP */}

                            <div>

                              <p className="font-serif text-lg font-bold text-[#24352a]">
                                {
                                  translateCrop(
                                    item.commodity ||
                                      "Unknown"
                                  )
                                }
                              </p>

                              <p className="text-sm text-slate-500">
                                {
                                  translateVariety(
                                    item.variety ||
                                      "Variety not specified"
                                  )
                                }
                              </p>

                            </div>

                            {/* PRICES */}

                            {markets.map(
                              (
                                market
                              ) => {

                                const record =
                                  item.markets[
                                    market
                                  ];

                                const isBest =
                                  best ===
                                    market &&
                                  record;

                                return (
                                  <PriceCell
                                    key={
                                      market
                                    }
                                    price={
                                      record
                                        ? record.modalPrice
                                        : null
                                    }
                                    best={
                                      isBest
                                    }
                                    bestText={t(
                                      "best"
                                    )}
                                  />
                                );
                              }
                            )}

                            {/* BEST MARKET */}

                            <div>

                              {best ? (

                                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                  {
                                    getMandiName(
                                      best
                                    )
                                  }
                                </span>

                              ) : (

                                <span className="text-sm text-slate-400">
                                  —
                                </span>

                              )}

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

              </div>

              {/* =================================================
                  BOTTOM SECTION
              ================================================= */}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">

                {/* =================================================
                    MARKET PRICE COMPARISON
                ================================================= */}

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <h2 className="font-serif text-lg font-bold text-[#24352a]">
                        {t(
                          "marketPriceComparison"
                        )}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">

                        {t(
                          "compareCurrent"
                        )}{" "}

                        {selectedCrop ||
                          t("crop")}{" "}

                        {t(
                          "pricesAcross"
                        )}

                      </p>

                    </div>

                    <select
                      value={
                        selectedCrop
                      }
                      onChange={(e) =>
                        setSelectedCrop(
                          e.target.value
                        )
                      }
                      className="rounded-full border-0 bg-[#ebe8e1] px-4 py-2 text-sm font-medium text-[#24352a] outline-none"
                    >

                      {crops.map(
                        (crop) => (

                          <option
                            key={
                              crop
                            }
                            value={
                              crop
                            }
                          >
                            {
                              translateCrop(
                                crop
                              )
                            }
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  {/* COMPARISON */}

                  <div className="mt-6 space-y-4">

                    {marketComparison.length ===
                      0 && (

                      <div className="rounded-2xl bg-[#f5f3ee] p-5 text-center text-sm text-slate-500">
                        {t(
                          "noMarketPrices"
                        )}
                      </div>

                    )}

                    {marketComparison.map(
                      (item) => {

                        const isBest =
                          bestMarket?.market ===
                          item.market;

                        const maxPrice =
                          Math.max(
                            ...marketComparison.map(
                              (
                                market
                              ) =>
                                market.price
                            )
                          ) || 1;

                        const width =
                          (
                            item.price /
                            maxPrice
                          ) *
                          100;

                        return (
                          <div
                            key={
                              item.market
                            }
                          >

                            <div className="flex items-center justify-between">

                              <div className="flex items-center gap-2">

                                <MapPin
                                  size={16}
                                  className="text-[#2f7357]"
                                />

                                <span className="font-medium text-[#24352a]">
                                  {
                                    getMandiName(
                                      item.market
                                    )
                                  }
                                </span>

                                {isBest && (

                                  <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                                    BEST
                                  </span>

                                )}

                              </div>

                              <span className="font-bold text-[#24352a]">
                                {formatPrice(
                                  item.price
                                )}
                              </span>

                            </div>

                            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#ebe8e1]">

                              <div
                                className="h-full rounded-full bg-[#2f7357] transition-all"
                                style={{
                                  width: `${width}%`,
                                }}
                              />

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                  {/* API INFORMATION */}

                  <div className="mt-6 rounded-2xl bg-[#f5f3ee] p-4">

                    <div className="flex items-start gap-3">

                      <TrendingUp
                        size={20}
                        className="mt-0.5 text-[#2f7357]"
                      />

                      <div>

                        <p className="font-semibold text-[#24352a]">
                          {t(
                            "liveMarketData"
                          )}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {t(
                            "liveMarketDataDescription"
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    RIGHT COLUMN
                ================================================= */}

                <div className="space-y-5">

                  {/* =================================================
                      MARKET INSIGHT
                  ================================================= */}

                  <div className="rounded-3xl bg-[#2f7357] p-5">

                    <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-white">

                      <Zap
                        size={20}
                        className="text-yellow-300"
                        fill="currentColor"
                      />

                      {t(
                        "marketInsight"
                      )}

                    </h2>

                    {bestMarket ? (

                      <div className="mt-4">

                        <div className="rounded-2xl bg-[#438063] px-4 py-4">

                          <p className="text-sm text-green-100">
                            {t(
                              "bestCurrentPrice"
                            )}
                          </p>

                          <p className="mt-1 text-xl font-bold text-white">
                            {
                              translateCrop(
                                selectedCrop
                              )
                            }
                          </p>

                          <div className="mt-3 flex items-center justify-between">

                            <div>

                              <p className="text-sm text-green-100">
                                {
                                  getMandiName(
                                    bestMarket.market
                                  )
                                }
                              </p>

                              <p className="text-lg font-bold text-white">

                                {formatPrice(
                                  bestMarket.price
                                )}

                                <span className="ml-1 text-xs font-normal">
                                  /Q
                                </span>

                              </p>

                            </div>

                            <div className="rounded-full bg-green-500 px-4 py-2 text-xs font-bold text-white">
                              {t(
                                "highest"
                              )}
                            </div>

                          </div>

                        </div>

                        <p className="mt-3 text-xs leading-5 text-green-100">
                          {t(
                            "comparisonDisclaimer"
                          )}
                        </p>

                      </div>

                    ) : (

                      <p className="mt-4 text-sm text-green-100">
                        {t(
                          "noRecommendation"
                        )}
                      </p>

                    )}

                  </div>

                  {/* =================================================
                      AVAILABLE MANDIS
                  ================================================= */}

                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

                    <h2 className="font-serif text-lg font-bold text-[#24352a]">
                      {t(
                        "nearby"
                      )}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {t(
                        "marketsReturned"
                      )}
                    </p>

                    <div className="mt-3">

                      {markets.map(
                        (market) => {

                          const marketRecords =
                            normalizedRecords.filter(
                              (item) =>
                                item.market ===
                                market
                            );

                          const districts = [
                            ...new Set(
                              marketRecords
                                .map(
                                  (item) =>
                                    item.district
                                )
                                .filter(
                                  Boolean
                                )
                            ),
                          ];

                          return (

                            <div
                              key={
                                market
                              }
                              className="flex items-center justify-between border-b border-[#e5dfd2] py-4 last:border-b-0"
                            >

                              <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff3df] text-[#2f7357]">
                                  <MapPin
                                    size={19}
                                  />
                                </div>

                                <div>

                                  <p className="font-medium text-[#24352a]">
                                    {
                                      getMandiName(
                                        market
                                      )
                                    }
                                  </p>

                                  <p className="text-sm text-slate-500">

                                    {districts.join(
                                      ", "
                                    ) ||
                                      farmerLocation.district ||
                                      farmerLocation.state ||
                                      "Location unavailable"}

                                  </p>

                                </div>

                              </div>

                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                {t(
                                  "open"
                                )}
                              </span>

                            </div>

                          );
                        }
                      )}

                    </div>

                  </div>

                </div>

              </div>

            </>

          )}

        {/* =================================================
            TRANSLATION STATUS
        ================================================= */}

        {loadingTranslation &&
          language !== "en" && (

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

        {price
          ? `₹${Math.round(
              price
            ).toLocaleString(
              "en-IN"
            )}`
          : "—"}

      </span>

      {best && (

        <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
          {bestText}
        </span>

      )}

    </div>
  );
}