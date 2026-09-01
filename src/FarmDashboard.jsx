import React, { useEffect, useState } from "react";
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

import Layout from "./Layout.jsx";

import {
  loadYieldModel,
  predictYield,
  estimateProfit,
} from "./services/yieldprediction";

export default function FarmDashboardPage() {
  const [rainfall, setRainfall] = useState(50);
  const [fertilizer, setFertilizer] = useState(40);

  const [predictedYield, setPredictedYield] = useState(22);
  const [predictedProfit, setPredictedProfit] = useState(22 * 1900);

  const [modelLoading, setModelLoading] = useState(true);

  /*
   * ---------------------------------------------------------
   * FARM / MODEL INPUTS
   * ---------------------------------------------------------
   *
   * These values are used because the ONNX model expects:
   *
   * crop
   * season
   * state
   * area
   * rainfall
   * fertilizer
   * pesticide
   *
   * Rainfall and fertilizer are controlled by the sliders.
   */

  const crop = "Cotton";
  const season = "Kharif";
  const state = "Maharashtra";
  const area = 4.2;
  const pesticide = 50;

  /*
   * ---------------------------------------------------------
   * LOAD YIELD MODEL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function initializeModel() {
      try {
        setModelLoading(true);

        await loadYieldModel();
      } catch (error) {
        console.error(
          "Failed to load yield model:",
          error
        );
      } finally {
        setModelLoading(false);
      }
    }

    initializeModel();
  }, []);

  /*
   * ---------------------------------------------------------
   * RUN YIELD PREDICTION
   * ---------------------------------------------------------
   *
   * Runs every time rainfall or fertilizer changes.
   */

  useEffect(() => {
    if (modelLoading) return;

    let cancelled = false;

    async function runPrediction() {
      try {
        const inputs = {
          crop,
          season,
          state,
          area,
          rainfall,
          fertilizer,
          pesticide,
        };

        const result = await predictYield(inputs);

        /*
         * Support either:
         *
         * predictYield() -> number
         *
         * or
         *
         * predictYield() -> { predictedYield: number }
         */

        const yieldValue =
          typeof result === "number"
            ? result
            : Number(
                result?.predictedYield ??
                  result?.yield ??
                  0
              );

        if (!Number.isFinite(yieldValue)) {
          throw new Error(
            "Yield prediction returned an invalid number"
          );
        }

        /*
         * Market price used for the What-If calculation.
         *
         * This is NOT Gemini.
         * It is simply the supplied/reference price used
         * to calculate estimated profit.
         */

        const marketPricePerQuintal = 1900;

        const profitValue = estimateProfit(
          yieldValue,
          marketPricePerQuintal,
          area,
          15000
        );

        if (!Number.isFinite(profitValue)) {
          throw new Error(
            "Profit calculation returned an invalid number"
          );
        }

        if (cancelled) return;

        setPredictedYield(yieldValue);
        setPredictedProfit(profitValue);
      } catch (error) {
        console.error(
          "Yield prediction failed:",
          error
        );

        /*
         * Safe local fallback.
         *
         * This prevents NaN/undefined from appearing if
         * the ONNX model cannot be loaded or returns an
         * invalid value.
         *
         * The fallback is only used when the model fails.
         */

        const fallbackYield =
          22 +
          (Number(rainfall) - 50) * 0.08 +
          (Number(fertilizer) - 40) * 0.03;

        const safeYield = Math.max(
          0,
          Number(fallbackYield)
        );

        const fallbackProfit =
          safeYield * 1900 - area * 15000;

        if (cancelled) return;

        setPredictedYield(safeYield);
        setPredictedProfit(fallbackProfit);
      }
    }

    runPrediction();

    return () => {
      cancelled = true;
    };
  }, [
    rainfall,
    fertilizer,
    modelLoading,
  ]);

  return (
    <Layout title="Farm Dashboard">
      <div className="space-y-6">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-2xl font-bold text-[#24352a]">
            Farm Analytics Dashboard
          </h2>

          <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-[#e5dfd2]">
            Ramesh Farm · 4.2 Acres · Nashik
          </div>
        </div>

        {/* =====================================================
            TOP STAT CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* ESTIMATED YIELD */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f0df] text-[#2f7357]">
              <Wheat size={24} />
            </div>

            <p className="mt-4 font-serif text-3xl font-bold text-[#2f7357]">
              58 Q
            </p>

            <p className="mt-1 text-sm font-semibold text-[#24352a]">
              Estimated Yield
            </p>

            <p className="mt-1 text-sm text-slate-500">
              +8% vs last season
            </p>
          </div>

          {/* EXPECTED PROFIT */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <TrendingUp size={24} />
            </div>

            <p className="mt-4 font-serif text-3xl font-bold text-green-600">
              ₹1,10,000
            </p>

            <p className="mt-1 text-sm font-semibold text-[#24352a]">
              Expected Profit
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Cotton + Wheat
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
              Farm Health Score
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Good condition
            </p>
          </div>

          {/* YIELD RISK */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <AlertTriangle size={24} />
            </div>

            <p className="mt-4 font-serif text-3xl font-bold text-orange-500">
              Low
            </p>

            <p className="mt-1 text-sm font-semibold text-[#24352a]">
              Yield Risk
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No major threats
            </p>
          </div>
        </div>

        {/* =====================================================
            YIELD HISTORY + FACTORS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.8fr]">

          {/* YIELD HISTORY */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <h3 className="font-serif text-lg font-bold text-[#24352a]">
              Yield History (Quintals)
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
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
                <span>Jan</span>
              </div>
            </div>
          </div>

          {/* KEY YIELD FACTORS */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <h3 className="font-serif text-lg font-bold text-[#24352a]">
              Key Yield Factors
            </h3>

            <div className="mt-5 space-y-5">
              <Factor
                label="Soil Moisture"
                value={72}
                color="bg-blue-500"
              />

              <Factor
                label="Fertilizer Level"
                value={65}
                color="bg-green-500"
              />

              <Factor
                label="Pest Control"
                value={80}
                color="bg-[#2f7357]"
              />

              <Factor
                label="Weather Impact"
                value={45}
                color="bg-orange-500"
              />
            </div>
          </div>
        </div>

        {/* =====================================================
            WHAT-IF SIMULATOR
        ====================================================== */}

        <div className="rounded-3xl bg-[#d9f4dc] p-6">

          <div className="flex flex-wrap items-center gap-2">
            <Zap
              size={21}
              className="text-[#2f7357]"
            />

            <h3 className="font-serif text-xl font-bold text-[#24352a]">
              What-If Simulator
            </h3>

            <span className="rounded-full bg-[#2f7357] px-3 py-1 text-xs font-bold text-white">
              Predictive AI
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr_1.25fr]">

            {/* RAINFALL */}

            <SliderControl
              icon={<CloudRain size={18} />}
              label="Rainfall"
              value={rainfall}
              setValue={setRainfall}
              unit="mm"
            />

            {/* FERTILIZER */}

            <SliderControl
              icon={<Sprout size={18} />}
              label="Fertilizer"
              value={fertilizer}
              setValue={setFertilizer}
              unit="%"
            />

            {/* RESULTS */}

            <div className="rounded-2xl bg-white p-5">

              <p className="text-xs font-bold tracking-wide text-slate-500">
                PREDICTED RESULTS
              </p>

              <div className="mt-5">
                <p className="font-serif text-3xl font-bold text-[#2f7357]">
                  {Number.isFinite(Number(predictedYield))
                    ? Number(predictedYield).toFixed(1)
                    : "0.0"}{" "}
                  Q
                </p>

                <p className="text-sm text-slate-500">
                  Estimated Yield
                </p>
              </div>

              <div className="my-4 border-t border-[#e5dfd2]" />

              <div>
                <p className="text-2xl font-bold text-green-600">
                  ₹
                  {Number.isFinite(
                    Number(predictedProfit)
                  )
                    ? Number(
                        predictedProfit
                      ).toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })
                    : "0"}
                </p>

                <p className="text-sm text-slate-500">
                  Expected Profit
                </p>
              </div>

              {/* AI OPTIMIZATION */}

              <button
                type="button"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#2f7357] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#245d46]"
              >
                <Mic size={17} />
                Ask AI to Optimize
              </button>
            </div>
          </div>
        </div>

        {/* MODEL STATUS */}

        {modelLoading && (
          <p className="text-center text-xs text-slate-500">
            Loading yield prediction model...
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
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#24352a]">
          {label}
        </p>

        <p className="text-sm font-bold text-[#24352a]">
          {value}%
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9e5dc]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
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