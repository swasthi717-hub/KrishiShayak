import React, { useEffect, useRef, useState } from "react";
import {
  Wheat,
  TrendingUp,
  Activity,
  AlertTriangle,
  CloudRain,
  Sprout,
  Zap,
  Mic,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "./Layout.jsx";

import {
  loadYieldModel,
  predictYield,
  estimateProfit,
  getYieldFactors,
} from "./services/yieldprediction.js";

import { useLanguage } from "./context/LanguageContext";
import { translateTexts } from "./services/translation";

/*
 * =============================================================
 * TRANSLATABLE UI TEXT
 * =============================================================
 */

const UI_TEXT = [
  "Farm Analytics Dashboard",
  "Ramesh Farm",
  "Acres",
  "Nashik",

  "Estimated Yield",
  "+8% vs last season",

  "Expected Profit",
  "Cotton",
  "Wheat",

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
  "Fertilizer Level",
  "Pest Control",
  "Weather Impact",

  "What-If Simulator",
  "Predictive AI",

  "Rainfall",
  "Fertilizer",

  "Predicted Results",
  "Estimated Yield",
  "Expected Profit",

  "Ask AI to Optimize",
  "Opens AI Copilot with your current simulation",
  "Loading yield prediction model...",
  "Calculating...",
  "Loading...",
];

function createTranslationMap(translatedTexts) {
  const map = {};

  UI_TEXT.forEach((text, index) => {
    map[text] = translatedTexts[index] || text;
  });

  return map;
}

const FARM = {
  name: "Ramesh Farm",
  crop: "Cotton",
  season: "Kharif",
  state: "Maharashtra",
  area: 4.2,
  pesticide: 50,
  marketPricePerQuintal: 1900,
  costPerAcre: 15000,
};

export default function FarmDashboardPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [translations, setTranslations] = useState({});
  const [rainfall, setRainfall] = useState(50);
  const [fertilizer, setFertilizer] = useState(40);

  const [modelLoading, setModelLoading] = useState(true);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [modelError, setModelError] = useState("");

  const [predictedYield, setPredictedYield] = useState(22);
  const [predictedProfit, setPredictedProfit] = useState(
    22 * FARM.marketPricePerQuintal
  );

  const [yieldFactors, setYieldFactors] = useState(null);
  const [modelReady, setModelReady] = useState(false);

  // Prevent an older async prediction from overwriting a newer one.
  const predictionRequestId = useRef(0);

  /*
   * =========================================================
   * TRANSLATION
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadTranslations() {
      try {
        if (language === "en") {
          const englishMap = {};
          UI_TEXT.forEach((text) => {
            englishMap[text] = text;
          });

          if (!cancelled) {
            setTranslations(englishMap);
          }

          return;
        }

        const translated = await translateTexts(
          UI_TEXT,
          language,
          "en"
        );

        if (!cancelled) {
          setTranslations(createTranslationMap(translated));
        }
      } catch (error) {
        console.error("Farm Dashboard translation failed:", error);

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

  const t = (text) => translations[text] || text;

  /*
   * =========================================================
   * LOAD YIELD MODEL + FACTORS
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function initializeModel() {
      try {
        setModelLoading(true);
        setModelError("");

        await loadYieldModel();

        if (cancelled) return;

        setModelReady(true);

        try {
          const factors = await getYieldFactors();

          if (!cancelled) {
            setYieldFactors(factors);
          }
        } catch (error) {
          console.warn("Could not load yield factors:", error);
        }
      } catch (error) {
        console.error("Failed to load yield model:", error);

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

  /*
   * =========================================================
   * RUN YIELD PREDICTION
   * =========================================================
   */

  useEffect(() => {
    if (!modelReady) return;

    const requestId = ++predictionRequestId.current;
    let cancelled = false;

    async function runPrediction() {
      setPredictionLoading(true);
      setModelError("");

      try {
        const inputs = {
          crop: FARM.crop,
          season: FARM.season,
          state: FARM.state,
          area: FARM.area,
          rainfall,
          fertilizer,
          pesticide: FARM.pesticide,
        };

        const result = await predictYield(inputs);

        // Support both a numeric return value and an object response.
        const yieldValue =
          typeof result === "number"
            ? result
            : Number(
                result?.predictedYield ??
                  result?.yield ??
                  result?.prediction ??
                  0
              );

        if (!Number.isFinite(yieldValue)) {
          throw new Error(
            "Yield prediction returned an invalid number."
          );
        }

        const profitValue = estimateProfit(
          yieldValue,
          FARM.marketPricePerQuintal,
          FARM.area,
          FARM.costPerAcre
        );

        if (!Number.isFinite(Number(profitValue))) {
          throw new Error(
            "Profit calculation returned an invalid number."
          );
        }

        if (
          cancelled ||
          requestId !== predictionRequestId.current
        ) {
          return;
        }

        setPredictedYield(yieldValue);
        setPredictedProfit(Number(profitValue));
      } catch (error) {
        console.error("Yield prediction failed:", error);

        if (
          cancelled ||
          requestId !== predictionRequestId.current
        ) {
          return;
        }

        // Safe local fallback so the What-If simulator still works
        // if the model is temporarily unavailable.
        const fallbackYield =
          22 +
          (Number(rainfall) - 50) * 0.08 +
          (Number(fertilizer) - 40) * 0.03;

        const safeYield = Math.max(0, Number(fallbackYield));

        const fallbackProfit =
          safeYield * FARM.marketPricePerQuintal -
          FARM.area * FARM.costPerAcre;

        setPredictedYield(safeYield);
        setPredictedProfit(fallbackProfit);
        setModelError(
          error?.message ||
            "Unable to calculate the yield prediction. Showing an estimated result."
        );
      } finally {
        if (
          !cancelled &&
          requestId === predictionRequestId.current
        ) {
          setPredictionLoading(false);
        }
      }
    }

    runPrediction();

    return () => {
      cancelled = true;
    };
  }, [modelReady, rainfall, fertilizer]);

  /*
   * =========================================================
   * ASK AI → OPEN COPILOT
   * =========================================================
   */

  function handleAskAI() {
    if (
      !Number.isFinite(Number(predictedYield)) ||
      !Number.isFinite(Number(predictedProfit))
    ) {
      return;
    }

    const prompt = `
Help me optimize my current farm simulation.

Farm:
${FARM.name}

Crop:
${FARM.crop}

Area:
${FARM.area} acres

State:
${FARM.state}

Current simulator inputs:
- Rainfall: ${rainfall} mm
- Fertilizer: ${fertilizer}%

Current model output:
- Estimated yield: ${Number(predictedYield).toFixed(2)} quintals
- Expected profit: ₹${Math.round(
      predictedProfit
    ).toLocaleString("en-IN")}

Please explain:
1. What the current result means.
2. Whether the current rainfall and fertilizer settings look reasonable.
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

  return (
    <Layout title={t("Farm Analytics Dashboard")}>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-2xl font-bold text-[#24352a]">
            {t("Farm Analytics Dashboard")}
          </h2>

          <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-[#e5dfd2]">
            {t(FARM.name)} · {FARM.area} {t("Acres")} ·{" "}
            {t(FARM.state)}
          </div>
        </div>

        {/* MODEL ERROR */}
        {modelError && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {modelError}
          </div>
        )}

        {/* TOP STAT CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* ESTIMATED YIELD */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f0df] text-[#2f7357]">
              <Wheat size={24} />
            </div>

            <p className="mt-4 font-serif text-3xl font-bold text-[#2f7357]">
              {Number.isFinite(Number(predictedYield))
                ? `${Number(predictedYield).toFixed(1)} Q`
                : "58 Q"}
            </p>

            <p className="mt-1 text-sm font-semibold text-[#24352a]">
              {t("Estimated Yield")}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t("+8% vs last season")}
            </p>
          </div>

          {/* EXPECTED PROFIT */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <TrendingUp size={24} />
            </div>

            <p className="mt-4 font-serif text-3xl font-bold text-green-600">
              {Number.isFinite(Number(predictedProfit))
                ? `₹${Math.round(
                    predictedProfit
                  ).toLocaleString("en-IN")}`
                : "₹1,10,000"}
            </p>

            <p className="mt-1 text-sm font-semibold text-[#24352a]">
              {t("Expected Profit")}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t("Cotton")} + {t("Wheat")}
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
              {t("Farm Health Score")}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t("Good condition")}
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
              {t("Yield Risk")}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {t("No major threats")}
            </p>
          </div>
        </div>

        {/* HISTORY + FACTORS */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.8fr]">
          {/* HISTORY */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <h3 className="font-serif text-lg font-bold text-[#24352a]">
              {t("Yield History (Quintals)")}
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
                <line x1="0" y1="10" x2="700" y2="10" stroke="#eeeae2" />
                <line x1="0" y1="57" x2="700" y2="57" stroke="#eeeae2" />
                <line x1="0" y1="105" x2="700" y2="105" stroke="#eeeae2" />
                <line x1="0" y1="152" x2="700" y2="152" stroke="#eeeae2" />
                <line x1="0" y1="200" x2="700" y2="200" stroke="#eeeae2" />

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

                <circle cx="15" cy="100" r="4" fill="#2f7357" />
                <circle cx="175" cy="108" r="4" fill="#2f7357" />
                <circle cx="315" cy="75" r="4" fill="#2f7357" />
                <circle cx="455" cy="65" r="4" fill="#2f7357" />
                <circle cx="580" cy="92" r="4" fill="#2f7357" />
                <circle cx="685" cy="40" r="4" fill="#2f7357" />
              </svg>

              <div className="absolute bottom-1 left-7 right-0 flex justify-between text-xs text-slate-500">
                <span>{t("Aug")}</span>
                <span>{t("Sep")}</span>
                <span>{t("Oct")}</span>
                <span>{t("Nov")}</span>
                <span>{t("Dec")}</span>
                <span>{t("Jan")}</span>
              </div>
            </div>
          </div>

          {/* FACTORS */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <h3 className="font-serif text-lg font-bold text-[#24352a]">
              {t("Key Yield Factors")}
            </h3>

            <div className="mt-5 space-y-5">
              <Factor
                label={t("Soil Moisture")}
                value={
                  yieldFactors?.soilMoisture ??
                  yieldFactors?.soil_moisture ??
                  72
                }
                color="bg-blue-500"
              />

              <Factor
                label={t("Fertilizer Level")}
                value={fertilizer}
                color="bg-green-500"
              />

              <Factor
                label={t("Pest Control")}
                value={FARM.pesticide}
                color="bg-[#2f7357]"
              />

              <Factor
                label={t("Weather Impact")}
                value={Math.max(
                  0,
                  Math.min(100, 100 - rainfall)
                )}
                color="bg-orange-500"
              />
            </div>
          </div>
        </div>

        {/* WHAT-IF SIMULATOR */}
        <div className="rounded-3xl bg-[#d9f4dc] p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Zap
              size={21}
              className="text-[#2f7357]"
            />

            <h3 className="font-serif text-xl font-bold text-[#24352a]">
              {t("What-If Simulator")}
            </h3>

            <span className="rounded-full bg-[#2f7357] px-3 py-1 text-xs font-bold text-white">
              {t("Predictive AI")}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr_1.25fr]">
            {/* RAINFALL */}
            <SliderControl
              icon={<CloudRain size={18} />}
              label={t("Rainfall")}
              value={rainfall}
              setValue={setRainfall}
              unit="mm"
            />

            {/* FERTILIZER */}
            <SliderControl
              icon={<Sprout size={18} />}
              label={t("Fertilizer")}
              value={fertilizer}
              setValue={setFertilizer}
              unit="%"
            />

            {/* RESULTS */}
            <div className="rounded-2xl bg-white p-5">
              <p className="text-xs font-bold tracking-wide text-slate-500">
                {t("Predicted Results")}
              </p>

              <div className="mt-5">
                <p className="font-serif text-3xl font-bold text-[#2f7357]">
                  {predictionLoading
                    ? t("Calculating...")
                    : Number.isFinite(Number(predictedYield))
                      ? Number(predictedYield).toFixed(1)
                      : "0.0"}{" "}
                  {!predictionLoading && "Q"}
                </p>

                <p className="text-sm text-slate-500">
                  {t("Estimated Yield")}
                </p>
              </div>

              <div className="my-4 border-t border-[#e5dfd2]" />

              <div>
                <p className="text-2xl font-bold text-green-600">
                  {predictionLoading
                    ? t("Calculating...")
                    : `₹${
                        Number.isFinite(
                          Number(predictedProfit)
                        )
                          ? Number(
                              predictedProfit
                            ).toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            })
                          : "0"
                      }`}
                </p>

                <p className="text-sm text-slate-500">
                  {t("Expected Profit")}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAskAI}
                disabled={
                  predictionLoading ||
                  modelLoading ||
                  !Number.isFinite(
                    Number(predictedYield)
                  ) ||
                  !Number.isFinite(
                    Number(predictedProfit)
                  )
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#2f7357] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#245d46] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mic size={17} />
                {t("Ask AI to Optimize")}
              </button>

              <p className="mt-2 text-center text-xs text-slate-400">
                {t(
                  "Opens AI Copilot with your current simulation"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* MODEL STATUS */}
        {modelLoading && (
          <p className="text-center text-xs text-slate-500">
            {t("Loading yield prediction model...")}
          </p>
        )}
      </div>
    </Layout>
  );
}

/*
 * =============================================================
 * FACTOR COMPONENT
 * =============================================================
 */

function Factor({ label, value, color }) {
  const numericValue = Number(value);

  const safeValue = Number.isFinite(numericValue)
    ? Math.max(0, Math.min(100, numericValue))
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#24352a]">
          {label}
        </p>

        <p className="text-sm font-bold text-[#24352a]">
          {Math.round(safeValue)}%
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

/*
 * =============================================================
 * SLIDER COMPONENT
 * =============================================================
 */

function SliderControl({
  icon,
  label,
  value,
  setValue,
  unit,
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
          {value}
          {unit}
        </p>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) =>
          setValue(Number(e.target.value))
        }
        className="mt-4 w-full accent-[#2f7357]"
      />

      <div className="flex justify-between text-xs text-slate-500">
        <span>
          0{unit}
        </span>

        <span>
          100{unit}
        </span>
      </div>
    </div>
  );
}
