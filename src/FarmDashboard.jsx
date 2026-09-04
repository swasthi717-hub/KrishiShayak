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

import {
  loadYieldModel,
  predictYield,
  estimateProfit,
  getYieldFactors,
} from "./services/yieldprediction.js";

const FARM = {
  name: "Ramesh Farm",
  crop: "Cotton",
  season: "Kharif",
  state: "Maharashtra",
  area: 4.2,
  pesticide: 50,

  // Temporary demo value until Mandi API is connected.
  marketPricePerQuintal: 1900,

  // Temporary demo cultivation cost.
  costPerAcre: 7000,
};

// ONNX model output is tonnes/hectare.
const ACRES_TO_HECTARES = 0.404686;
const TONNES_TO_QUINTALS = 10;

export default function FarmDashboardPage() {
  const navigate = useNavigate();

  // =========================================================
  // WHAT-IF INPUTS
  // =========================================================

  const [rainfall, setRainfall] = useState(50);
  const [farmArea, setFarmArea] = useState(FARM.area);

  // =========================================================
  // MODEL STATE
  // =========================================================

  const [modelReady, setModelReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [predictionLoading, setPredictionLoading] =
    useState(false);
  const [modelError, setModelError] = useState("");

  const [predictedYield, setPredictedYield] =
    useState(null);

  const [predictedProfit, setPredictedProfit] =
    useState(null);

  const [yieldFactors, setYieldFactors] =
    useState(null);

  // Model details shown below the simulator.
  const [predictionDebug, setPredictionDebug] =
    useState(null);

  // Prevents an older async prediction from overwriting
  // a newer slider prediction.
  const predictionRequestId = useRef(0);

  // =========================================================
  // LOAD MODEL
  // =========================================================

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

  // =========================================================
  // RUN PREDICTION
  // =========================================================

  useEffect(() => {
    if (!modelReady) {
      return;
    }

    const requestId =
      ++predictionRequestId.current;

    let cancelled = false;

    async function runPrediction() {
      setPredictionLoading(true);
      setModelError("");

      try {
        const result = await predictYield({
          crop: FARM.crop,
          season: FARM.season,
          state: FARM.state,
          area: farmArea,
          rainfall,
        });

        const numericYield = Number(result);

        if (!Number.isFinite(numericYield)) {
          throw new Error(
            "Yield model returned an invalid number."
          );
        }

        // =====================================================
        // MODEL OUTPUT CONVERSION
        //
        // Model output = tonnes/hectare
        //
        // Acres -> hectares
        // tonnes/hectare -> total tonnes
        // total tonnes -> quintals
        // =====================================================

        const areaHectares =
          farmArea * ACRES_TO_HECTARES;

        const totalProductionQuintals =
          numericYield *
          areaHectares *
          TONNES_TO_QUINTALS;

        // =====================================================
        // PROFIT
        //
        // Revenue = total quintals × market price
        // Cost = cost per acre × farm area
        // Profit = revenue − total cost
        // =====================================================

        const profit = estimateProfit(
          totalProductionQuintals,
          FARM.marketPricePerQuintal,
          farmArea,
          FARM.costPerAcre
        );

        if (
          cancelled ||
          requestId !== predictionRequestId.current
        ) {
          return;
        }

        const revenue =
          totalProductionQuintals *
          FARM.marketPricePerQuintal;

        const totalCost =
          FARM.costPerAcre * farmArea;

        setPredictedYield(numericYield);
        setPredictedProfit(profit);

        setPredictionDebug({
          run: requestId,
          rainfall,
          farmArea,
          areaHectares,
          modelPrediction: numericYield,
          totalProductionQuintals,
          marketPrice:
            FARM.marketPricePerQuintal,
          revenue,
          totalCost,
          profit,
          status: "Prediction completed",
        });
      } catch (error) {
        console.error(
          "Yield prediction failed:",
          error
        );

        if (
          cancelled ||
          requestId !== predictionRequestId.current
        ) {
          return;
        }

        setPredictedYield(null);
        setPredictedProfit(null);

        setPredictionDebug({
          run: requestId,
          rainfall,
          farmArea,
          status: "Prediction failed",
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
  }, [modelReady, rainfall, farmArea]);

  // =========================================================
  // ASK AI → OPEN COPILOT
  // =========================================================

  function handleAskAI() {
    if (
      !Number.isFinite(Number(predictedYield)) ||
      !Number.isFinite(Number(predictedProfit))
    ) {
      return;
    }

    const areaHectares =
      farmArea * ACRES_TO_HECTARES;

    const totalProductionQuintals =
      Number(predictedYield) *
      areaHectares *
      TONNES_TO_QUINTALS;

    const prompt = `
Help me optimize my current farm simulation.

Farm:
${FARM.name}

Crop:
${FARM.crop}

Area:
${farmArea} acres

State:
${FARM.state}

Current simulator inputs:
- Rainfall: ${rainfall} mm
- Farm area: ${farmArea} acres
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

  // =========================================================
  // DISPLAY
  // =========================================================

  const displayedYield =
    predictionLoading
      ? "Calculating..."
      : Number.isFinite(Number(predictedYield))
        ? `${(
            Number(predictedYield) *
            farmArea *
            ACRES_TO_HECTARES *
            TONNES_TO_QUINTALS
          ).toFixed(1)} Q`
        : modelLoading
          ? "Loading..."
          : "--";

  const displayedProfit =
    predictionLoading
      ? "Calculating..."
      : Number.isFinite(Number(predictedProfit))
        ? `₹${Math.round(
            predictedProfit
          ).toLocaleString("en-IN")}`
        : "--";

  return (
    <Layout title="Farm Dashboard">
      <div className="space-y-6">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <h2 className="font-serif text-2xl font-bold text-[#24352a]">
            Farm Analytics Dashboard
          </h2>

          <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-[#e5dfd2]">
            {FARM.name} · {farmArea.toFixed(1)} Acres · Nashik
          </div>

        </div>

        {/* ===================================================
            MODEL ERROR
        =================================================== */}

        {modelError && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {modelError}
          </div>
        )}

        {/* ===================================================
            TOP CARDS
        =================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* YIELD */}

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
              Total farm production
            </p>

          </div>

          {/* PROFIT */}

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

          {/* HEALTH */}

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

          {/* RISK */}

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

        {/* ===================================================
            HISTORY + FACTORS
        =================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.8fr]">

          {/* HISTORY */}

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

          {/* FACTORS */}

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
                label="Farm Area"
                value={(farmArea / 10) * 100}
                color="bg-green-500"
                displayValue={`${farmArea.toFixed(1)} acres`}
              />

              <Factor
                label="Pest Control"
                value={FARM.pesticide}
                color="bg-[#2f7357]"
              />

              <Factor
                label="Weather Impact"
                value={Math.max(
                  0,
                  Math.min(100, 100 - rainfall)
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
              What-If Simulator
            </h3>

            <span className="rounded-full bg-[#2f7357] px-3 py-1 text-xs font-bold text-white">
              Predictive AI
            </span>

          </div>

          {/* =================================================
              YIELD MODEL LOADING MESSAGE
          ================================================= */}

          {modelLoading && (
            <div className="mt-4 rounded-xl border border-[#cfe3d1] bg-white/80 px-4 py-3 text-sm text-[#59645c] shadow-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#cbd5cb] border-t-[#2f7357]" />

                <span className="font-medium">
                  Preparing yield prediction model...
                </span>
              </div>

              <p className="mt-1 pl-6 text-xs leading-5 text-slate-500">
                Preparing the AI model for prediction. This may take a
                few moments the first time.
              </p>
            </div>
          )}

          {/* =================================================
              SLIDERS + RESULTS
          ================================================= */}

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr_1.25fr]">

            {/* RAINFALL */}

            <SliderControl
              icon={<CloudRain size={18} />}
              label="Rainfall"
              value={rainfall}
              setValue={setRainfall}
              unit="mm"
            />

            {/* FARM AREA */}

            <SliderControl
              icon={<Ruler size={18} />}
              label="Farm Area"
              value={farmArea}
              setValue={setFarmArea}
              min={1}
              max={10}
              step={0.1}
              unit=" acres"
              decimals={1}
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
                Ask AI to Optimize
              </button>

              <p className="mt-2 text-center text-xs text-slate-400">
                Opens AI Copilot with your current simulation
              </p>

            </div>

          </div>

          {/* =================================================
              HORIZONTAL MODEL DETAILS
          ================================================= */}

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Model Details
              </p>

              <span className="text-xs text-slate-400">
                Live simulation values
              </span>

            </div>

            {predictionDebug ? (
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">

                <DebugRow
                  label="Model prediction"
                  value={
                    Number.isFinite(
                      Number(
                        predictionDebug.modelPrediction
                      )
                    )
                      ? `${Number(
                          predictionDebug.modelPrediction
                        ).toFixed(2)} tonnes/ha`
                      : "--"
                  }
                />

                <DebugRow
                  label="Total production"
                  value={
                    Number.isFinite(
                      Number(
                        predictionDebug.totalProductionQuintals
                      )
                    )
                      ? `${Number(
                          predictionDebug.totalProductionQuintals
                        ).toFixed(1)} Q`
                      : "--"
                  }
                />

                <DebugRow
                  label="Farm area"
                  value={`${Number(
                    predictionDebug.farmArea
                  ).toFixed(1)} acres`}
                />

                <DebugRow
                  label="Rainfall"
                  value={`${predictionDebug.rainfall} mm`}
                />

                <DebugRow
                  label="Market price"
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
                  label="Revenue"
                  value={
                    Number.isFinite(
                      Number(predictionDebug.revenue)
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
                  label="Total cost"
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
                  label="Profit"
                  value={
                    Number.isFinite(
                      Number(predictionDebug.profit)
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
                Prediction details will appear after the model runs.
              </p>
            )}

            <p className="mt-5 border-t border-[#e5dfd2] pt-4 text-xs leading-5 text-slate-400">
              Profit currently uses the temporary ₹1,900/Q market
              price and ₹7,000 per acre demo cultivation cost.
              The market price will be replaced by the Mandi API
              when it is connected.
            </p>

          </div>

        </div>

      </div>
    </Layout>
  );
}

// =============================================================
// DEBUG ROW
// =============================================================

function DebugRow({ label, value }) {
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

// =============================================================
// FACTOR
// =============================================================

function Factor({
  label,
  value,
  color,
  displayValue,
}) {
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
          {displayValue ??
            `${Math.round(safeValue)}%`}
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

// =============================================================
// SLIDER
// =============================================================

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
          {Number(value).toFixed(decimals)}
          {unit}
        </p>

      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) =>
          setValue(Number(e.target.value))
        }
        className="mt-4 w-full accent-[#2f7357]"
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