import React, { useEffect, useRef, useState } from "react";

import {
  Wheat,
  TrendingUp,
  Activity,
  AlertTriangle,
  CloudRain,
  Ruler,
  Mic,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import Layout from "./Layout.jsx";

import { supabase } from "./lib/supabase";

import { useAuth } from "./context/AuthContext";

import { useLanguage } from "./context/LanguageContext";

import { translateTexts } from "./services/translation";

import {
  loadYieldModel,
  predictYield,
  estimateProfit,
  getYieldFactors,
} from "./services/yieldprediction.js";

/* =============================================================
   TRANSLATABLE UI TEXT
   ============================================================= */

const UI_TEXT = [
  "Farm Analytics Dashboard",
  "Acres",
  "Nashik",
  "Estimated Yield",
  "Total farm production",
  "Expected Profit",
  "Farm Health Score",
  "Good condition",
  "Low",
  "Yield Risk",
  "No major threats",
  "Yield History (Quintals)",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Key Yield Factors",
  "Soil Moisture",
  "Farm Area",
  "Pest Control",
  "Weather Impact",
  "What-If Simulator",
  "Predictive AI",
  "Rainfall",
  "Predicted Results",
  "Ask AI to Optimize",
  "Opens AI Copilot with your current simulation",
  "Preparing yield prediction model...",
  "Preparing the AI model for prediction. This may take a few moments the first time.",
  "Calculating...",
  "Loading...",
  "Loading farm profile...",
  "Area not set",
  "State not set",
  "Model Details",
  "Live simulation values",
  "Prediction details will appear after the model runs.",
  "Model prediction",
  "Total production",
  "Market price",
  "Revenue",
  "Total cost",
  "Profit",
];

/* =============================================================
   TRANSLATION MAP
   ============================================================= */

function createTranslationMap(translatedTexts) {
  const map = {};

  UI_TEXT.forEach((text, index) => {
    map[text] =
      translatedTexts[index] || text;
  });

  return map;
}

/* =============================================================
   HARDCODED DEMO VALUES
   These remain hardcoded as requested.
   ============================================================= */

const FARM = {
  season: "Kharif",
  pesticide: 50,

  // Temporary demo market price.
  marketPricePerQuintal: 1200,

  // Temporary demo cultivation cost.
  costPerAcre: 12000,
};

// ONNX model output is tonnes/hectare.
const ACRES_TO_HECTARES = 0.404686;
const TONNES_TO_QUINTALS = 10;

/* =============================================================
   AREA CONVERSION
   ============================================================= */

function convertAreaToAcres(area, unit) {
  const numericArea = Number(area);

  if (
    !Number.isFinite(numericArea) ||
    numericArea <= 0
  ) {
    return null;
  }

  switch (unit) {
    case "acre":
      return numericArea;

    case "hectare":
      return numericArea * 2.47105;

    case "sq_m":
      return numericArea * 0.000247105;

    case "guntha":
      // 40 guntha = 1 acre.
      return numericArea * 0.025;

    case "bigha":
      // Bigha varies by region, so do not silently
      // invent a universal conversion.
      return null;

    default:
      return null;
  }
}

/* =============================================================
   PAGE
   ============================================================= */

export default function FarmDashboardPage() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const { language } = useLanguage();

  /* ===========================================================
     TRANSLATION
     =========================================================== */

  const [translations, setTranslations] =
    useState({});

  useEffect(() => {
    let cancelled = false;

    async function loadTranslations() {
      try {
        if (
          !language ||
          language === "en"
        ) {
          const englishMap = {};

          UI_TEXT.forEach((text) => {
            englishMap[text] = text;
          });

          if (!cancelled) {
            setTranslations(
              englishMap
            );
          }

          return;
        }

        const translated =
          await translateTexts(
            UI_TEXT,
            language,
            "en"
          );

        if (!cancelled) {
          setTranslations(
            createTranslationMap(
              translated
            )
          );
        }
      } catch (error) {
        console.error(
          "Farm Dashboard translation failed:",
          error
        );

        const fallback = {};

        UI_TEXT.forEach((text) => {
          fallback[text] = text;
        });

        if (!cancelled) {
          setTranslations(fallback);
        }
      }
    }

    loadTranslations();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const t = (text) =>
    translations[text] || text;

  /* ===========================================================
     DYNAMIC FARMER DATA FROM ONBOARDING
     =========================================================== */

  const [farmerName, setFarmerName] =
    useState("");

  const [farmerCrop, setFarmerCrop] =
    useState("");

  const [farmerState, setFarmerState] =
    useState("");

  const [farmerDistrict, setFarmerDistrict] =
    useState("");

  const [farmArea, setFarmArea] =
    useState(null);

  const [
    farmerDataLoading,
    setFarmerDataLoading,
  ] = useState(true);

  const [
    farmerDataError,
    setFarmerDataError,
  ] = useState("");

  /* ===========================================================
     WHAT-IF INPUTS
     =========================================================== */

  const [rainfall, setRainfall] =
    useState(50);

  /* ===========================================================
     MODEL STATE
     =========================================================== */

  const [modelReady, setModelReady] =
    useState(false);

  const [modelLoading, setModelLoading] =
    useState(true);

  const [
    predictionLoading,
    setPredictionLoading,
  ] = useState(false);

  const [modelError, setModelError] =
    useState("");

  const [
    predictedYield,
    setPredictedYield,
  ] = useState(null);

  const [
    predictedProfit,
    setPredictedProfit,
  ] = useState(null);

  const [
    yieldFactors,
    setYieldFactors,
  ] = useState(null);

  const [
    predictionDebug,
    setPredictionDebug,
  ] = useState(null);

  // Prevents an older async prediction from
  // overwriting a newer slider prediction.
  const predictionRequestId =
    useRef(0);

  /* ===========================================================
     LOAD FARMER PROFILE / FARM / CROP
     =========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadFarmerData() {
      if (!user?.id) {
        if (!cancelled) {
          setFarmerDataLoading(false);

          setFarmerDataError(
            "You must be logged in to view your farm dashboard."
          );
        }

        return;
      }

      try {
        setFarmerDataLoading(true);
        setFarmerDataError("");

        /* -----------------------------------------------------
           1. PROFILE

           Name + state + district
           ----------------------------------------------------- */

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "name, state, district"
          )
          .eq(
            "user_id",
            user.id
          )
          .single();

        if (profileError) {
          throw profileError;
        }

        /* -----------------------------------------------------
           2. FARM

           Area + area unit
           ----------------------------------------------------- */

        const {
          data: farm,
          error: farmError,
        } = await supabase
          .from("farms")
          .select(
            "id, area, area_unit, state, district"
          )
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          )
          .limit(1)
          .maybeSingle();

        if (farmError) {
          throw farmError;
        }

        if (!farm) {
          throw new Error(
            "No farm information was found. Please complete onboarding."
          );
        }

        /* -----------------------------------------------------
           3. CROPS

           Main crop
           ----------------------------------------------------- */

        const {
          data: crops,
          error: cropsError,
        } = await supabase
          .from("crops")
          .select(
            "crop_name, acreage"
          )
          .eq(
            "farm_id",
            farm.id
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

        if (cropsError) {
          throw cropsError;
        }

        const mainCrop =
          crops?.find(
            (item) =>
              item?.crop_name &&
              String(
                item.crop_name
              ).trim()
          ) || null;

        if (!mainCrop) {
          throw new Error(
            "No crop information was found. Please complete onboarding."
          );
        }

        /* -----------------------------------------------------
           4. CONVERT AREA TO ACRES

           Dashboard/model uses acres.
           ----------------------------------------------------- */

        const areaInAcres =
          convertAreaToAcres(
            farm.area,
            farm.area_unit
          );

        if (
          !Number.isFinite(
            areaInAcres
          )
        ) {
          throw new Error(
            `The farm area unit "${farm.area_unit}" cannot be converted to acres automatically.`
          );
        }

        if (cancelled) {
          return;
        }

        setFarmerName(
          String(
            profile?.name ||
              user.user_metadata?.name ||
              ""
          ).trim()
        );

        setFarmerCrop(
          String(
            mainCrop.crop_name
          ).trim()
        );

        setFarmerState(
          String(
            profile?.state ||
              farm?.state ||
              ""
          ).trim()
        );

        setFarmerDistrict(
          String(
            profile?.district ||
              farm?.district ||
              ""
          ).trim()
        );

        setFarmArea(
          areaInAcres
        );
      } catch (error) {
        console.error(
          "Failed to load farmer dashboard data:",
          error
        );

        if (!cancelled) {
          setFarmerName("");
          setFarmerCrop("");
          setFarmerState("");
          setFarmerDistrict("");
          setFarmArea(null);

          setFarmerDataError(
            error?.message ||
              "Unable to load your farm information."
          );
        }
      } finally {
        if (!cancelled) {
          setFarmerDataLoading(
            false
          );
        }
      }
    }

    loadFarmerData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /* ===========================================================
     LOAD YIELD MODEL + FACTORS
     =========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function initializeModel() {
      try {
        setModelLoading(true);
        setModelError("");

        await loadYieldModel();

        if (cancelled) {
          return;
        }

        setModelReady(true);

        try {
          const factors =
            await getYieldFactors();

          if (!cancelled) {
            setYieldFactors(
              factors
            );
          }
        } catch (error) {
          console.warn(
            "Could not load yield factors:",
            error
          );
        }
      } catch (error) {
        console.error(
          "Failed to load yield model:",
          error
        );

        if (!cancelled) {
          setModelError(
            error?.message ||
              "Unable to load the yield prediction model."
          );

          setModelReady(false);
        }
      } finally {
        if (!cancelled) {
          setModelLoading(false);
        }
      }
    }

    initializeModel();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ===========================================================
     RUN YIELD PREDICTION
     =========================================================== */

  useEffect(() => {
    if (!modelReady) {
      return;
    }

    if (farmerDataLoading) {
      return;
    }

    if (!farmerCrop || !farmerState) {
      return;
    }

    if (
      !Number.isFinite(
        Number(farmArea)
      )
    ) {
      return;
    }

    const requestId =
      ++predictionRequestId.current;

    let cancelled = false;

    async function runPrediction() {
      setPredictionLoading(true);
      setModelError("");

      try {
        const result =
          await predictYield({
            crop: farmerCrop,
            season: FARM.season,
            state: farmerState,
            area: farmArea,
            rainfall,
          });

        const yieldValue =
          typeof result === "number"
            ? result
            : Number(
                result?.predictedYield ??
                  result?.yield ??
                  result?.prediction ??
                  NaN
              );

        if (
          !Number.isFinite(
            yieldValue
          )
        ) {
          throw new Error(
            "Yield prediction returned an invalid number."
          );
        }

        /* -----------------------------------------------------
           MODEL OUTPUT CONVERSION

           Model output:
           tonnes/hectare
           ----------------------------------------------------- */

        const areaHectares =
          farmArea *
          ACRES_TO_HECTARES;

        const totalProductionQuintals =
          yieldValue *
          areaHectares *
          TONNES_TO_QUINTALS;

        /* -----------------------------------------------------
           PROFIT

           Revenue =
           total quintals × market price

           Cost =
           cost per acre × farm area

           Profit =
           revenue − cost
           ----------------------------------------------------- */

        const profitValue =
          estimateProfit(
            totalProductionQuintals,
            FARM.marketPricePerQuintal,
            farmArea,
            FARM.costPerAcre
          );

        if (
          !Number.isFinite(
            Number(profitValue)
          )
        ) {
          throw new Error(
            "Profit calculation returned an invalid number."
          );
        }

        if (
          cancelled ||
          requestId !==
            predictionRequestId.current
        ) {
          return;
        }

        const revenue =
          totalProductionQuintals *
          FARM.marketPricePerQuintal;

        const totalCost =
          FARM.costPerAcre *
          farmArea;

        setPredictedYield(
          yieldValue
        );

        setPredictedProfit(
          Number(profitValue)
        );

        setPredictionDebug({
          run: requestId,
          rainfall,
          farmArea,
          areaHectares,
          modelPrediction:
            yieldValue,
          totalProductionQuintals,
          marketPrice:
            FARM.marketPricePerQuintal,
          revenue,
          totalCost,
          profit: Number(
            profitValue
          ),
          status:
            "Prediction completed",
        });
      } catch (error) {
        console.error(
          "Yield prediction failed:",
          error
        );

        if (
          cancelled ||
          requestId !==
            predictionRequestId.current
        ) {
          return;
        }

        setPredictedYield(null);
        setPredictedProfit(null);

        setPredictionDebug({
          run: requestId,
          rainfall,
          farmArea,
          status:
            "Prediction failed",
          error:
            error?.message ||
            "Unknown prediction error",
        });

        setModelError(
          error?.message ||
            "Unable to calculate the yield prediction."
        );
      } finally {
        if (
          !cancelled &&
          requestId ===
            predictionRequestId.current
        ) {
          setPredictionLoading(
            false
          );
        }
      }
    }

    runPrediction();

    return () => {
      cancelled = true;
    };
  }, [
    modelReady,
    farmerDataLoading,
    farmerCrop,
    farmerState,
    rainfall,
    farmArea,
  ]);

  /* ===========================================================
     ASK AI → OPEN COPILOT
     =========================================================== */

  function handleAskAI() {
    if (
      !farmerName ||
      !farmerCrop ||
      !farmerState
    ) {
      return;
    }

    if (
      !Number.isFinite(
        Number(farmArea)
      )
    ) {
      return;
    }

    if (
      !Number.isFinite(
        Number(predictedYield)
      ) ||
      !Number.isFinite(
        Number(predictedProfit)
      )
    ) {
      return;
    }

    const areaHectares =
      farmArea *
      ACRES_TO_HECTARES;

    const totalProductionQuintals =
      Number(predictedYield) *
      areaHectares *
      TONNES_TO_QUINTALS;

    const prompt = `
Help me optimize my current farm simulation.

Farmer:
${farmerName}

Crop:
${farmerCrop}

Area:
${farmArea.toFixed(2)} acres

State:
${farmerState}

${
  farmerDistrict
    ? `District:
${farmerDistrict}`
    : ""
}

Current simulator inputs:
- Rainfall: ${rainfall} mm
- Farm area: ${farmArea.toFixed(2)} acres
- Farm area in hectares: ${areaHectares.toFixed(2)} ha

Current model output:
- Model yield: ${Number(
      predictedYield
    ).toFixed(2)} tonnes/hectare
- Estimated total production: ${totalProductionQuintals.toFixed(
      1
    )} quintals
- Expected profit: ₹${Math.round(
      predictedProfit
    ).toLocaleString("en-IN")}

Please explain:
1. What the current result means.
2. Whether the current rainfall and farm area settings look reasonable.
3. What practical changes the farmer could consider.
4. Any important caution.

Do not invent weather, market prices, pesticide dosages, or guaranteed outcomes.

Keep the advice simple and practical for an Indian farmer.
`;

    navigate("/ai-copilot", {
      state: {
        prompt,
      },
    });
  }

  /* ===========================================================
     DISPLAY VALUES
     =========================================================== */

  const displayedYield =
    farmerDataLoading
      ? t("Loading...")
      : predictionLoading
        ? t("Calculating...")
        : Number.isFinite(
            Number(predictedYield)
          )
          ? `${(
              Number(
                predictedYield
              ) *
              Number(farmArea) *
              ACRES_TO_HECTARES *
              TONNES_TO_QUINTALS
            ).toFixed(1)} Q`
          : modelLoading
            ? t("Loading...")
            : "--";

  const displayedProfit =
    farmerDataLoading
      ? t("Loading...")
      : predictionLoading
        ? t("Calculating...")
        : Number.isFinite(
            Number(predictedProfit)
          )
          ? `₹${Math.round(
              predictedProfit
            ).toLocaleString("en-IN")}`
          : "--";

  const safeFarmArea =
    Number.isFinite(
      Number(farmArea)
    )
      ? Number(farmArea)
      : 0;

  return (
    <Layout
      title={t(
        "Farm Analytics Dashboard"
      )}
    >
      <div className="space-y-6">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <h2 className="font-serif text-2xl font-bold text-[#24352a]">
            {t(
              "Farm Analytics Dashboard"
            )}
          </h2>

          <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-[#e5dfd2]">
            {farmerDataLoading
              ? t("Loading farm profile...")
              : `${farmerName || "Farmer"} · ${
                  Number.isFinite(
                    Number(farmArea)
                  )
                    ? `${Number(
                        farmArea
                      ).toFixed(
                        1
                      )} ${t(
                        "Acres"
                      )}`
                    : t(
                        "Area not set"
                      )
                } · ${
                  farmerState ||
                  t(
                    "State not set"
                  )
                }`}
          </div>

        </div>

        {/* ===================================================
            FARMER DATA ERROR
        =================================================== */}

        {farmerDataError && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {farmerDataError}
          </div>
        )}

        {/* ===================================================
            MODEL ERROR
        =================================================== */}

        {modelError && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {modelError}
          </div>
        )}

        {/* ===================================================
            TOP STAT CARDS
        =================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* ESTIMATED YIELD */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f0df] text-[#2f7357]">
              <Wheat size={24} />
            </div>

            <p className="mt-4 font-serif text-3xl font-bold text-[#2f7357]">
              {displayedYield}
            </p>

            <p className="mt-1 text-sm font-semibold text-[#24352a]">
              {t(
                "Estimated Yield"
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t(
                "Total farm production"
              )}
            </p>

          </div>

          {/* EXPECTED PROFIT */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <TrendingUp size={24} />
            </div>

            <p className="mt-4 font-serif text-3xl font-bold text-green-600">
              {displayedProfit}
            </p>

            <p className="mt-1 text-sm font-semibold text-[#24352a]">
              {t(
                "Expected Profit"
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {farmerCrop || "--"}
            </p>

          </div>

          {/* FARM HEALTH */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Activity size={24} />
            </div>

            <p className="mt-4 font-serif text-3xl font-bold text-blue-600">
              82 / 100
            </p>

            <p className="mt-1 text-sm font-semibold text-[#24352a]">
              {t(
                "Farm Health Score"
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t(
                "Good condition"
              )}
            </p>

          </div>

          {/* YIELD RISK */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <AlertTriangle size={24} />
            </div>

            <p className="mt-4 font-serif text-3xl font-bold text-orange-500">
              {t("Low")}
            </p>

            <p className="mt-1 text-sm font-semibold text-[#24352a]">
              {t(
                "Yield Risk"
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t(
                "No major threats"
              )}
            </p>

          </div>

        </div>

        {/* ===================================================
            HISTORY + FACTORS
        =================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.8fr]">

          {/* HISTORY */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <h3 className="font-serif text-lg font-bold text-[#24352a]">
              {t(
                "Yield History (Quintals)"
              )}
            </h3>

            <div className="relative mt-5 h-[250px]">

              <div className="absolute left-0 top-0 flex h-[190px] flex-col justify-between text-xs text-slate-500">
                <span>80</span>
                <span>60</span>
                <span>40</span>
                <span>20</span>
                <span>0</span>
              </div>

              <svg
                viewBox="0 0 700 210"
                className="absolute left-7 top-0 h-[210px] w-[calc(100%-28px)]"
                preserveAspectRatio="none"
              >

                <line
                  x1="0"
                  y1="10"
                  x2="700"
                  y2="10"
                  stroke="#eeeae2"
                />

                <line
                  x1="0"
                  y1="57"
                  x2="700"
                  y2="57"
                  stroke="#eeeae2"
                />

                <line
                  x1="0"
                  y1="105"
                  x2="700"
                  y2="105"
                  stroke="#eeeae2"
                />

                <line
                  x1="0"
                  y1="152"
                  x2="700"
                  y2="152"
                  stroke="#eeeae2"
                />

                <line
                  x1="0"
                  y1="200"
                  x2="700"
                  y2="200"
                  stroke="#eeeae2"
                />

                <path
                  d="
                    M 15 100
                    C 90 105, 130 115, 175 108
                    C 230 100, 260 70, 315 75
                    C 370 80, 400 55, 455 65
                    C 510 75, 535 105, 580 92
                    C 625 80, 650 65, 685 40
                    L 685 200
                    L 15 200
                    Z
                  "
                  fill="#2f7357"
                  opacity="0.08"
                />

                <path
                  d="
                    M 15 100
                    C 90 105, 130 115, 175 108
                    C 230 100, 260 70, 315 75
                    C 370 80, 400 55, 455 65
                    C 510 75, 535 105, 580 92
                    C 625 80, 650 65, 685 40
                  "
                  fill="none"
                  stroke="#2f7357"
                  strokeWidth="3"
                />

                <circle
                  cx="15"
                  cy="100"
                  r="4"
                  fill="#2f7357"
                />

                <circle
                  cx="175"
                  cy="108"
                  r="4"
                  fill="#2f7357"
                />

                <circle
                  cx="315"
                  cy="75"
                  r="4"
                  fill="#2f7357"
                />

                <circle
                  cx="455"
                  cy="65"
                  r="4"
                  fill="#2f7357"
                />

                <circle
                  cx="580"
                  cy="92"
                  r="4"
                  fill="#2f7357"
                />

                <circle
                  cx="685"
                  cy="40"
                  r="4"
                  fill="#2f7357"
                />

              </svg>

              <div className="absolute bottom-1 left-7 right-0 flex justify-between text-xs text-slate-500">

                <span>
                  {t("Aug")}
                </span>

                <span>
                  {t("Sep")}
                </span>

                <span>
                  {t("Oct")}
                </span>

                <span>
                  {t("Nov")}
                </span>

                <span>
                  {t("Dec")}
                </span>

                <span>
                  {t("Jan")}
                </span>

              </div>

            </div>

          </div>

          {/* FACTORS */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <h3 className="font-serif text-lg font-bold text-[#24352a]">
              {t(
                "Key Yield Factors"
              )}
            </h3>

            <div className="mt-5 space-y-5">

              <Factor
                label={t(
                  "Soil Moisture"
                )}
                value={
                  yieldFactors?.soilMoisture ??
                  yieldFactors?.soil_moisture ??
                  72
                }
                color="bg-blue-500"
              />

              <Factor
                label={t(
                  "Farm Area"
                )}
                value={
                  safeFarmArea > 0
                    ? (safeFarmArea /
                        10) *
                      100
                    : 0
                }
                color="bg-green-500"
                displayValue={
                  safeFarmArea > 0
                    ? `${safeFarmArea.toFixed(
                        1
                      )} ${t(
                        "Acres"
                      )}`
                    : "--"
                }
              />

              <Factor
                label={t(
                  "Pest Control"
                )}
                value={
                  FARM.pesticide
                }
                color="bg-[#2f7357]"
              />

              <Factor
                label={t(
                  "Weather Impact"
                )}
                value={Math.max(
                  0,
                  Math.min(
                    100,
                    100 -
                      rainfall
                  )
                )}
                color="bg-orange-500"
              />

            </div>

          </div>

        </div>

        {/* ===================================================
            WHAT-IF SIMULATOR
        =================================================== */}

        <div className="rounded-3xl bg-[#d9f4dc] p-6">

          <div className="flex flex-wrap items-center gap-2">

            <span className="text-[#2f7357]">
              <Activity size={21} />
            </span>

            <h3 className="font-serif text-xl font-bold text-[#24352a]">
              {t(
                "What-If Simulator"
              )}
            </h3>

            <span className="rounded-full bg-[#2f7357] px-3 py-1 text-xs font-bold text-white">
              {t(
                "Predictive AI"
              )}
            </span>

          </div>

          {/* =================================================
              FARM INFORMATION
          ================================================= */}

          {!farmerDataLoading &&
            farmerName &&
            farmerCrop &&
            farmerState && (

              <div className="mt-4 rounded-xl border border-[#cfe3d1] bg-white/80 px-4 py-3 text-sm text-[#59645c] shadow-sm">

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">

                  <div>
                    <span className="text-xs text-slate-400">
                      Farmer
                    </span>

                    <p className="font-semibold text-[#24352a]">
                      {farmerName}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400">
                      Crop
                    </span>

                    <p className="font-semibold text-[#24352a]">
                      {farmerCrop}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400">
                      State
                    </span>

                    <p className="font-semibold text-[#24352a]">
                      {farmerState}
                    </p>
                  </div>

                </div>

              </div>
            )}

          {/* =================================================
              YIELD MODEL LOADING MESSAGE
          ================================================= */}

          {modelLoading && (

            <div className="mt-4 rounded-xl border border-[#cfe3d1] bg-white/80 px-4 py-3 text-sm text-[#59645c] shadow-sm">

              <div className="flex items-center gap-2">

                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#cbd5cb] border-t-[#2f7357]" />

                <span className="font-medium">
                  {t(
                    "Preparing yield prediction model..."
                  )}
                </span>

              </div>

              <p className="mt-1 pl-6 text-xs leading-5 text-slate-500">
                {t(
                  "Preparing the AI model for prediction. This may take a few moments the first time."
                )}
              </p>

            </div>
          )}

          {/* =================================================
              SLIDERS + RESULTS
          ================================================= */}

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr_1.25fr]">

            {/* RAINFALL */}

            <SliderControl
              icon={
                <CloudRain
                  size={18}
                />
              }
              label={t("Rainfall")}
              value={rainfall}
              setValue={setRainfall}
              unit=" mm"
            />

            {/* FARM AREA */}

            <SliderControl
              icon={
                <Ruler size={18} />
              }
              label={t(
                "Farm Area"
              )}
              value={
                Number.isFinite(
                  Number(
                    farmArea
                  )
                )
                  ? Number(
                      farmArea
                    )
                  : 1
              }
              setValue={
                setFarmArea
              }
              min={1}
              max={10}
              step={0.1}
              unit={` ${t(
                "Acres"
              )}`}
              decimals={1}
              disabled={
                !Number.isFinite(
                  Number(
                    farmArea
                  )
                )
              }
            />

            {/* RESULTS */}

            <div className="rounded-2xl bg-white p-5">

              <p className="text-xs font-bold tracking-wide text-slate-500">
                {t(
                  "Predicted Results"
                )}
              </p>

              <div className="mt-5">

                <p className="font-serif text-3xl font-bold text-[#2f7357]">
                  {displayedYield}
                </p>

                <p className="text-sm text-slate-500">
                  {t(
                    "Estimated Yield"
                  )}
                </p>

              </div>

              <div className="my-4 border-t border-[#e5dfd2]" />

              <div>

                <p className="text-2xl font-bold text-green-600">
                  {displayedProfit}
                </p>

                <p className="text-sm text-slate-500">
                  {t(
                    "Expected Profit"
                  )}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleAskAI
                }
                disabled={
                  farmerDataLoading ||
                  predictionLoading ||
                  modelLoading ||
                  !farmerName ||
                  !farmerCrop ||
                  !farmerState ||
                  !Number.isFinite(
                    Number(
                      predictedYield
                    )
                  ) ||
                  !Number.isFinite(
                    Number(
                      predictedProfit
                    )
                  )
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#2f7357] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#245d46] disabled:cursor-not-allowed disabled:opacity-60"
              >

                <Mic size={17} />

                {t(
                  "Ask AI to Optimize"
                )}

              </button>

              <p className="mt-2 text-center text-xs text-slate-400">
                {t(
                  "Opens AI Copilot with your current simulation"
                )}
              </p>

            </div>

          </div>

          {/* =================================================
              MODEL DETAILS
          ================================================= */}

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t(
                  "Model Details"
                )}
              </p>

              <span className="text-xs text-slate-400">
                {t(
                  "Live simulation values"
                )}
              </span>

            </div>

            {predictionDebug ? (

              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">

                <DebugRow
                  label={t(
                    "Model prediction"
                  )}
                  value={
                    Number.isFinite(
                      Number(
                        predictionDebug.modelPrediction
                      )
                    )
                      ? `${Number(
                          predictionDebug.modelPrediction
                        ).toFixed(
                          2
                        )} tonnes/ha`
                      : "--"
                  }
                />

                <DebugRow
                  label={t(
                    "Total production"
                  )}
                  value={
                    Number.isFinite(
                      Number(
                        predictionDebug.totalProductionQuintals
                      )
                    )
                      ? `${Number(
                          predictionDebug.totalProductionQuintals
                        ).toFixed(
                          1
                        )} Q`
                      : "--"
                  }
                />

                <DebugRow
                  label={t(
                    "Farm area"
                  )}
                  value={
                    Number.isFinite(
                      Number(
                        predictionDebug.farmArea
                      )
                    )
                      ? `${Number(
                          predictionDebug.farmArea
                        ).toFixed(
                          1
                        )} ${t(
                          "Acres"
                        )}`
                      : "--"
                  }
                />

                <DebugRow
                  label={t(
                    "Rainfall"
                  )}
                  value={`${predictionDebug.rainfall} mm`}
                />

                <DebugRow
                  label={t(
                    "Market price"
                  )}
                  value={
                    Number.isFinite(
                      Number(
                        predictionDebug.marketPrice
                      )
                    )
                      ? `₹${Number(
                          predictionDebug.marketPrice
                        ).toLocaleString(
                          "en-IN"
                        )}/Q`
                      : "--"
                  }
                />

                <DebugRow
                  label={t(
                    "Revenue"
                  )}
                  value={
                    Number.isFinite(
                      Number(
                        predictionDebug.revenue
                      )
                    )
                      ? `₹${Math.round(
                          predictionDebug.revenue
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      : "--"
                  }
                />

                <DebugRow
                  label={t(
                    "Total cost"
                  )}
                  value={
                    Number.isFinite(
                      Number(
                        predictionDebug.totalCost
                      )
                    )
                      ? `₹${Math.round(
                          predictionDebug.totalCost
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      : "--"
                  }
                />

                <DebugRow
                  label={t(
                    "Profit"
                  )}
                  value={
                    Number.isFinite(
                      Number(
                        predictionDebug.profit
                      )
                    )
                      ? `₹${Math.round(
                          predictionDebug.profit
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      : "--"
                  }
                />

              </div>

            ) : (

              <p className="mt-3 text-xs text-slate-500">
                {t(
                  "Prediction details will appear after the model runs."
                )}
              </p>

            )}

            <p className="mt-5 border-t border-[#e5dfd2] pt-4 text-xs leading-5 text-slate-400">
              Profit currently uses the temporary ₹1,200/Q market
              price and ₹12,000 per acre demo cultivation cost.
              The market price will be replaced by the Mandi API
              when it is connected.
            </p>

          </div>

        </div>

      </div>
    </Layout>
  );
}

/* =============================================================
   DEBUG ROW
   ============================================================= */

function DebugRow({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#24352a]">
        {value}
      </p>
    </div>
  );
}

/* =============================================================
   FACTOR COMPONENT
   ============================================================= */

function Factor({
  label,
  value,
  color,
  displayValue,
}) {
  const numericValue =
    Number(value);

  const safeValue =
    Number.isFinite(
      numericValue
    )
      ? Math.max(
          0,
          Math.min(
            100,
            numericValue
          )
        )
      : 0;

  return (
    <div>

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-[#24352a]">
          {label}
        </p>

        <p className="text-sm font-bold text-[#24352a]">
          {displayValue ??
            `${Math.round(
              safeValue
            )}%`}
        </p>

      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9e5dc]">

        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${safeValue}%`,
          }}
        />

      </div>

    </div>
  );
}

/* =============================================================
   SLIDER COMPONENT
   ============================================================= */

function SliderControl({
  icon,
  label,
  value,
  setValue,
  unit,
  min = 0,
  max = 100,
  step = 1,
  decimals = 0,
  disabled = false,
}) {
  return (
    <div>

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">

          <span className="text-[#2f7357]">
            {icon}
          </span>

          <p className="text-sm font-bold text-[#24352a]">
            {label}
          </p>

        </div>

        <p className="text-sm font-bold text-[#2f7357]">
          {Number(
            value
          ).toFixed(
            decimals
          )}
          {unit}
        </p>

      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) =>
          setValue(
            Number(
              e.target.value
            )
          )
        }
        className="mt-4 w-full accent-[#2f7357] disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="flex justify-between text-xs text-slate-500">

        <span>
          {min}
          {unit}
        </span>

        <span>
          {max}
          {unit}
        </span>

      </div>

    </div>
  );
}