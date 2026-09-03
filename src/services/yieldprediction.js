// src/services/yieldprediction.js

import * as ort from "onnxruntime-web";

let session = null;
let mappings = null;
let loadingPromise = null;

// =============================================================
// MODEL FILES
// =============================================================

const MODEL_PATH = "/models/yield_model_farmer.onnx";
const MAPPINGS_PATH = "/models/mappings_farmer.json";

// 1 acre = 0.404686 hectares
const ACRES_TO_HECTARES = 0.404686;

// =============================================================
// ALIASES
// =============================================================

const cropAliases = {
  Cotton: "Cotton(lint)",
  "Moong (Green Gram)": "Moong(Green Gram)",
  "Rapeseed & Mustard": "Rapeseed &Mustard",
};

// =============================================================
// LOAD MODEL
// =============================================================

export async function loadYieldModel() {
  if (session && mappings) {
    return session;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      console.log("Loading farmer yield ONNX model...");

      const [loadedSession, mappingsResponse] =
        await Promise.all([
          ort.InferenceSession.create(MODEL_PATH, {
            executionProviders: ["wasm"],
          }),
          fetch(MAPPINGS_PATH),
        ]);

      if (!mappingsResponse.ok) {
        throw new Error(
          `Unable to load mappings_farmer.json (${mappingsResponse.status})`
        );
      }

      const loadedMappings = await mappingsResponse.json();

      if (!loadedMappings?.crop_mapping) {
        throw new Error(
          "mappings_farmer.json is missing crop_mapping"
        );
      }

      if (!loadedMappings?.season_mapping) {
        throw new Error(
          "mappings_farmer.json is missing season_mapping"
        );
      }

      if (!loadedMappings?.state_mapping) {
        throw new Error(
          "mappings_farmer.json is missing state_mapping"
        );
      }

      session = loadedSession;
      mappings = loadedMappings;

      console.log("Farmer yield model loaded successfully");
      console.log("Input names:", session.inputNames);
      console.log("Output names:", session.outputNames);
      console.log("Input metadata:", session.inputMetadata);

      return session;
    } catch (error) {
      session = null;
      mappings = null;

      console.error(
        "Failed to load farmer yield model:",
        error
      );

      throw new Error(
        `Failed to load yield model: ${
          error.message || error
        }`
      );
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

// =============================================================
// PREDICT YIELD
// =============================================================

export async function predictYield({
  crop,
  season,
  state,
  area,
  rainfall,
}) {
  if (!session || !mappings) {
    await loadYieldModel();
  }

  // -----------------------------------------------------------
  // Convert UI inputs
  // -----------------------------------------------------------

  const numericAreaAcres = Number(area);
  const numericRainfall = Number(rainfall);

  if (
    !Number.isFinite(numericAreaAcres) ||
    numericAreaAcres <= 0
  ) {
    throw new Error("Invalid farm area");
  }

  if (
    !Number.isFinite(numericRainfall) ||
    numericRainfall < 0
  ) {
    throw new Error("Invalid rainfall");
  }

  // -----------------------------------------------------------
  // Convert acres -> hectares
  //
  // The model was trained using Area in hectares.
  // -----------------------------------------------------------

  const numericAreaHectares =
    numericAreaAcres * ACRES_TO_HECTARES;

  // -----------------------------------------------------------
  // Map categorical values
  // -----------------------------------------------------------

  const cropKey = cropAliases[crop] || crop;

  const cropEncoded =
    Number(mappings.crop_mapping?.[cropKey]);

  const seasonEncoded =
    Number(mappings.season_mapping?.[season]);

  const stateEncoded =
    Number(mappings.state_mapping?.[state]);

  // -----------------------------------------------------------
  // Debug information
  // -----------------------------------------------------------

  console.log("Farmer yield prediction inputs:", {
    crop,
    season,
    state,
    areaAcres: numericAreaAcres,
    areaHectares: numericAreaHectares,
    rainfall: numericRainfall,
  });

  console.log("Mapped values:", {
    crop: {
      original: crop,
      mapped: cropKey,
      encoded: cropEncoded,
    },
    season: {
      original: season,
      encoded: seasonEncoded,
    },
    state: {
      original: state,
      encoded: stateEncoded,
    },
  });

  // -----------------------------------------------------------
  // Validate mappings
  // -----------------------------------------------------------

  if (!Number.isFinite(cropEncoded)) {
    throw new Error(
      `Crop "${crop}" is not present in mappings_farmer.json`
    );
  }

  if (!Number.isFinite(seasonEncoded)) {
    throw new Error(
      `Season "${season}" is not present in mappings_farmer.json`
    );
  }

  if (!Number.isFinite(stateEncoded)) {
    throw new Error(
      `State "${state}" is not present in mappings_farmer.json`
    );
  }

  // -----------------------------------------------------------
  // Create ONNX input
  //
  // The model expects exactly 5 features:
  //
  // [Crop_encoded,
  //  Season_encoded,
  //  State_encoded,
  //  Area,
  //  Annual_Rainfall]
  //
  // Area MUST be hectares.
  // -----------------------------------------------------------

  const inputArray = new Float32Array([
    cropEncoded,
    seasonEncoded,
    stateEncoded,
    numericAreaHectares,
    numericRainfall,
  ]);

  console.log(
    "Farmer ONNX input array:",
    Array.from(inputArray)
  );

  const inputTensor = new ort.Tensor(
    "float32",
    inputArray,
    [1, 5]
  );

  // -----------------------------------------------------------
  // Get model input/output names
  // -----------------------------------------------------------

  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];

  if (!inputName || !outputName) {
    throw new Error(
      "Yield model does not expose expected input/output tensors"
    );
  }

  // -----------------------------------------------------------
  // Run model
  // -----------------------------------------------------------

  const results = await session.run({
    [inputName]: inputTensor,
  });

  const output = results[outputName];

  if (!output?.data?.length) {
    throw new Error(
      "Yield model returned no prediction"
    );
  }

  // -----------------------------------------------------------
  // Convert log1p prediction back to original scale
  // -----------------------------------------------------------

  const predictionLog = Number(output.data[0]);

  if (!Number.isFinite(predictionLog)) {
    throw new Error(
      "Yield model returned an invalid prediction"
    );
  }

  const predictedYield = Math.expm1(predictionLog);

  if (
    !Number.isFinite(predictedYield) ||
    predictedYield < 0
  ) {
    throw new Error(
      "Yield model produced an invalid final prediction"
    );
  }

  console.log("Raw ONNX output:", predictionLog);

  console.log(
    "Final predicted yield:",
    predictedYield
  );

  return predictedYield;
}

// =============================================================
// PROFIT
// =============================================================

export function estimateProfit(
  predictedYield,
  marketPricePerQuintal,
  areaInAcres = 1,
  costPerAcre = 15000
) {
  const yieldValue = Number(predictedYield);
  const price = Number(marketPricePerQuintal);
  const area = Number(areaInAcres);
  const cost = Number(costPerAcre);

  if (!Number.isFinite(yieldValue)) {
    throw new Error("Invalid predicted yield");
  }

  if (!Number.isFinite(price)) {
    throw new Error("Invalid market price");
  }

  if (!Number.isFinite(area)) {
    throw new Error("Invalid farm area");
  }

  if (!Number.isFinite(cost)) {
    throw new Error("Invalid cost per acre");
  }

  /*
   * Keep this calculation unchanged for now.
   *
   * The exact unit of Yield_farmer still needs to be confirmed
   * before using it with a quintal market price.
   */

  const revenue = yieldValue * price;

  const totalCost = cost * area;

  const profit = revenue - totalCost;

  console.log("Profit calculation:", {
    predictedYield: yieldValue,
    marketPricePerQuintal: price,
    areaInAcres: area,
    costPerAcre: cost,
    revenue,
    totalCost,
    profit,
  });

  if (!Number.isFinite(profit)) {
    throw new Error(
      "Profit calculation produced an invalid number"
    );
  }

  return profit;
}

// =============================================================
// YIELD FACTORS
// =============================================================

export async function getYieldFactors() {
  const response = await fetch(
    "/models/yield_factors.json"
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load yield factors (${response.status})`
    );
  }

  return response.json();
}