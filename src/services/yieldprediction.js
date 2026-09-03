// src/services/yieldprediction.js

import * as ort from "onnxruntime-web";

let session = null;
let mappings = null;
let loadingPromise = null;

// =============================================================
// LOAD MODEL
// =============================================================

export async function loadYieldModel() {
  if (session && mappings) {
    return;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const [loadedSession, mappingsResponse] =
        await Promise.all([
          ort.InferenceSession.create(
            "/models/yield_model.onnx",
            {
              executionProviders: ["wasm"],
            }
          ),
          fetch("/models/mappings.json"),
        ]);

      if (!mappingsResponse.ok) {
        throw new Error(
          `Unable to load mappings.json (${mappingsResponse.status})`
        );
      }

      const loadedMappings =
        await mappingsResponse.json();

      if (!loadedMappings?.crop_mapping) {
        throw new Error(
          "mappings.json is missing crop_mapping"
        );
      }

      if (!loadedMappings?.season_mapping) {
        throw new Error(
          "mappings.json is missing season_mapping"
        );
      }

      if (!loadedMappings?.state_mapping) {
        throw new Error(
          "mappings.json is missing state_mapping"
        );
      }

      session = loadedSession;
      mappings = loadedMappings;

      console.log("Yield model loaded successfully");
      console.log("Input names:", session.inputNames);
      console.log("Output names:", session.outputNames);
      console.log(
        "Input metadata:",
        session.inputMetadata
      );

      return session;
    } catch (error) {
      session = null;
      mappings = null;

      console.error(
        "Failed to load yield model:",
        error
      );

      throw error;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

// =============================================================
// PREDICT
// =============================================================

export async function predictYield({
  crop,
  season,
  state,
  area,
  rainfall,
  fertilizer,
  pesticide,
}) {
  if (!session || !mappings) {
    throw new Error(
      "Yield model is not loaded. Call loadYieldModel() first."
    );
  }

  const numericArea = Number(area);
  const numericRainfall = Number(rainfall);
  const numericFertilizer = Number(fertilizer);
  const numericPesticide = Number(pesticide);

  if (!Number.isFinite(numericArea)) {
    throw new Error("Invalid farm area");
  }

  if (!Number.isFinite(numericRainfall)) {
    throw new Error("Invalid rainfall");
  }

  if (!Number.isFinite(numericFertilizer)) {
    throw new Error("Invalid fertilizer value");
  }

  if (!Number.isFinite(numericPesticide)) {
    throw new Error("Invalid pesticide value");
  }

  const cropEncoded =
    Number(mappings.crop_mapping?.[crop]);

  const seasonEncoded =
    Number(mappings.season_mapping?.[season]);

  const stateEncoded =
    Number(mappings.state_mapping?.[state]);

  if (!Number.isFinite(cropEncoded)) {
    throw new Error(
      `Crop "${crop}" is not present in mappings.json`
    );
  }

  if (!Number.isFinite(seasonEncoded)) {
    throw new Error(
      `Season "${season}" is not present in mappings.json`
    );
  }

  if (!Number.isFinite(stateEncoded)) {
    throw new Error(
      `State "${state}" is not present in mappings.json`
    );
  }

  const inputArray = new Float32Array([
    cropEncoded,
    seasonEncoded,
    stateEncoded,
    numericArea,
    numericRainfall,
    numericFertilizer,
    numericPesticide,
  ]);

  const inputTensor = new ort.Tensor(
    "float32",
    inputArray,
    [1, 7]
  );

  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];

  if (!inputName || !outputName) {
    throw new Error(
      "Yield model does not expose expected input/output tensors"
    );
  }

  const feeds = {
    [inputName]: inputTensor,
  };

  const results = await session.run(feeds);

  const output = results[outputName];

  if (!output?.data?.length) {
    throw new Error(
      "Yield model returned no prediction"
    );
  }

  const value = Number(output.data[0]);

  if (!Number.isFinite(value)) {
    throw new Error(
      "Yield model returned an invalid prediction"
    );
  }

  return value;
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
   * IMPORTANT:
   *
   * This assumes the ONNX model output is TOTAL farm yield.
   *
   * If your training target was yield per acre, change revenue to:
   *
   * const revenue = yieldValue * area * price;
   */
  const revenue = yieldValue * price;
  const totalCost = cost * area;

  const profit = revenue - totalCost;

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