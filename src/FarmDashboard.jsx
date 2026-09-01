import React, { useEffect, useState } from "react";

import {
  Wheat,
  TrendingUp,
  Activity,
  AlertTriangle,
  CloudRain,
  Sprout,
  Mic,
} from "lucide-react";

import Layout from "./Layout.jsx";

import {
  loadYieldModel,
  predictYield,
  estimateProfit,
  getYieldFactors,
} from "./services/yieldPrediction";

import { getYieldExplanation } from "./services/gemini";

export default function FarmDashboardPage() {
  // =========================================================
  // WHAT-IF INPUTS
  // =========================================================

  const [rainfall, setRainfall] = useState(50);
  const [fertilizer, setFertilizer] = useState(40);

  // =========================================================
  // MODEL STATE
  // =========================================================

  const [modelReady, setModelReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState("");

  const [predictedYield, setPredictedYield] = useState(null);
  const [predictedProfit, setPredictedProfit] = useState(null);

  const [yieldFactors, setYieldFactors] = useState(null);

  // =========================================================
  // GEMINI STATE
  // =========================================================

  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // =========================================================
  // LOAD ONNX MODEL
  // =========================================================

  useEffect(() => {
    async function initializeModel() {
      try {
        setModelLoading(true);
        setModelError("");

        await loadYieldModel();

        setModelReady(true);

        // Optional: load feature importance data
        try {
          const factors = await getYieldFactors();
          setYieldFactors(factors);
        } catch (error) {
          console.warn("Could not load yield factors:", error);
        }
      } catch (error) {
        console.error("Failed to load yield model:", error);
        setModelError(
          "Unable to load the yield prediction model."
        );
      } finally {
        setModelLoading(false);
      }
    }

    initializeModel();
  }, []);

  // =========================================================
  // RUN YIELD PREDICTION
  // =========================================================

  useEffect(() => {
    if (!modelReady) return;

    async function runPrediction() {
      try {
        /*
          IMPORTANT:

          These values must match the crop/season/state
          used by your actual model.

          Replace these demo values with the farmer's
          actual farm data once that is connected.
        */

        const result = await predictYield({
          crop: "Cotton",
          season: "Kharif",
          state: "Maharashtra",

          area: 4.2,

          rainfall: rainfall,

          fertilizer: fertilizer,

          pesticide: 50,
        });

        const numericYield = Number(result);

        setPredictedYield(numericYield);

        /*
          Demo market price.

          Replace this with your actual mandi price
          when the market data is connected.
        */

        const profit = estimateProfit(
          numericYield,
          1900,
          4.2,
          15000
        );

        setPredictedProfit(profit);

        // Clear previous AI response because inputs changed
        setAiExplanation("");
        setAiError("");
      } catch (error) {
        console.error("Yield prediction failed:", error);

        setPredictedYield(null);
        setPredictedProfit(null);
      }
    }

    runPrediction();
  }, [modelReady, rainfall, fertilizer]);

  // =========================================================
  // ASK GEMINI FOR OPTIMIZATION
  // =========================================================

  async function handleAskAI() {
    if (
      predictedYield === null ||
      predictedProfit === null
    ) {
      return;
    }

    try {
      setAiLoading(true);
      setAiError("");
      setAiExplanation("");

      const explanation = await getYieldExplanation(
        predictedYield,
        predictedProfit,
        {
          rainfall,
          fertilizer,
        }
      );

      setAiExplanation(explanation);
    } catch (error) {
      console.error("Gemini error:", error);

      setAiError(
        "AI advice is currently unavailable. Please check your internet connection."
      );
    } finally {
      setAiLoading(false);
    }
  }

  // =========================================================
  // DISPLAY VALUES
  // =========================================================

  const displayedYield =
    predictedYield !== null
      ? `${Number(predictedYield).toFixed(1)} Q`
      : modelLoading
        ? "Loading..."
        : "--";

  const displayedProfit =
    predictedProfit !== null
      ? `₹${Math.round(predictedProfit).toLocaleString("en-IN")}`
      : "--";

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
            MODEL ERROR
        ====================================================== */}

        {modelError && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {modelError}
          </div>
        )}

        {/* =====================================================
            TOP STAT CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Estimated Yield */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f0df] text-[#2f7357]">
              <Wheat size={24} />
            </div>

            <p className="mt-4 font-serif text-3xl font-bold text-[#2f7357]">
              {displayedYield}
            </p>

            <p className="mt-1 text-sm font-semibold text-[#24352a]">
              Estimated Yield
            </p>

            <p className="mt-1 text-sm text-slate-500">
              AI prediction
            </p>

          </div>

          {/* Expected Profit */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <TrendingUp size={24} />
            </div>

            <p className="mt-4 font-serif text-3xl font-bold text-green-600">
              {displayedProfit}
            </p>

            <p className="mt-1 text-sm font-semibold text-[#24352a]">
              Expected Profit
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Based on current inputs
            </p>

          </div>

          {/* Farm Health */}

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

          {/* Yield Risk */}

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
                  strokeWidth="1"
                />

                <line
                  x1="0"
                  y1="57"
                  x2="700"
                  y2="57"
                  stroke="#eeeae2"
                  strokeWidth="1"
                />

                <line
                  x1="0"
                  y1="105"
                  x2="700"
                  y2="105"
                  stroke="#eeeae2"
                  strokeWidth="1"
                />

                <line
                  x1="0"
                  y1="152"
                  x2="700"
                  y2="152"
                  stroke="#eeeae2"
                  strokeWidth="1"
                />

                <line
                  x1="0"
                  y1="200"
                  x2="700"
                  y2="200"
                  stroke="#eeeae2"
                  strokeWidth="1"
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

                <circle cx="15" cy="100" r="4" fill="#2f7357" />
                <circle cx="175" cy="108" r="4" fill="#2f7357" />
                <circle cx="315" cy="75" r="4" fill="#2f7357" />
                <circle cx="455" cy="65" r="4" fill="#2f7357" />
                <circle cx="580" cy="92" r="4" fill="#2f7357" />
                <circle cx="685" cy="40" r="4" fill="#2f7357" />

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
                value={fertilizer}
                color="bg-green-500"
              />

              <Factor
                label="Pest Control"
                value={80}
                color="bg-[#2f7357]"
              />

              <Factor
                label="Weather Impact"
                value={Math.max(0, Math.min(100, 100 - rainfall))}
                color="bg-orange-500"
              />

            </div>

          </div>

        </div>

        {/* =====================================================
            WHAT-IF SIMULATOR
        ====================================================== */}

        <div className="rounded-3xl bg-[#d9f4dc] p-6">

          {/* Heading */}

          <div className="flex flex-wrap items-center gap-2">

            <span className="text-[#2f7357]">
              <Activity size={21} />
            </span>

            <h3 className="font-serif text-xl font-bold text-[#24352a]">
              What-If Simulator
            </h3>

            <span className="rounded-full bg-[#2f7357] px-3 py-1 text-xs font-bold text-white">
              Predictive AI
            </span>

          </div>

          {/* Simulator */}

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr_1.25fr]">

            {/* Rainfall */}

            <SliderControl
              icon={<CloudRain size={18} />}
              label="Rainfall"
              value={rainfall}
              setValue={setRainfall}
              unit="mm"
            />

            {/* Fertilizer */}

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
                  {displayedYield}
                </p>

                <p className="text-sm text-slate-500">
                  Estimated Yield
                </p>

              </div>

              <div className="my-4 border-t border-[#e5dfd2]" />

              <div>

                <p className="text-2xl font-bold text-green-600">
                  {displayedProfit}
                </p>

                <p className="text-sm text-slate-500">
                  Expected Profit
                </p>

              </div>

              {/* ASK GEMINI */}

              <button
                type="button"
                onClick={handleAskAI}
                disabled={
                  aiLoading ||
                  modelLoading ||
                  predictedYield === null
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#2f7357] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#245d46] disabled:cursor-not-allowed disabled:opacity-60"
              >

                <Mic size={17} />

                {aiLoading
                  ? "Thinking..."
                  : "Ask AI to Optimize"}

              </button>

              {/* GEMINI ERROR */}

              {aiError && (
                <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                  {aiError}
                </div>
              )}

              {/* GEMINI RESPONSE */}

              {aiExplanation && (
                <div className="mt-4 rounded-xl bg-[#f4f8ef] p-4">

                  <p className="text-xs font-bold uppercase tracking-wide text-[#2f7357]">
                    AI Recommendation
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#3d4d40]">
                    {aiExplanation}
                  </p>

                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}

/* =========================================================
   FACTOR COMPONENT
========================================================= */

function Factor({
  label,
  value,
  color,
}) {
  return (
    <div>

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-[#24352a]">
          {label}
        </p>

        <p className="text-sm font-bold text-[#24352a]">
          {Math.round(value)}%
        </p>

      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9e5dc]">

        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${Math.max(
              0,
              Math.min(100, value)
            )}%`,
          }}
        />

      </div>

    </div>
  );
}

/* =========================================================
   SLIDER COMPONENT
========================================================= */

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