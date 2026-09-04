import * as ort from "onnxruntime-web";

let session = null;
let mappings = null;

export async function loadYieldModel() {
  session = await ort.InferenceSession.create(
    "/models/yield_model.onnx"
  );

  const response = await fetch("/models/mappings.json");

  if (!response.ok) {
    throw new Error("Failed to load yield model mappings");
  }

  mappings = await response.json();
}

/*
 * ---------------------------------------------------------
 * YIELD PREDICTION
 * ---------------------------------------------------------
 */

export async function predictYield({
  crop = "Cotton",
  season = "Kharif",
  state = "Maharashtra",
  area = 4.2,
  rainfall = 50,
  fertilizer = 40,
  pesticide = 50,
}) {
  if (!session || !mappings) {
    throw new Error(
      "Yield model not loaded. Call loadYieldModel() first."
    );
  }

  const cropEncoded =
    mappings.crop_mapping?.[crop] ?? 0;

  const seasonEncoded =
    mappings.season_mapping?.[season] ?? 0;

  const stateEncoded =
    mappings.state_mapping?.[state] ?? 0;

  const inputArray = new Float32Array([
    Number(cropEncoded),
    Number(seasonEncoded),
    Number(stateEncoded),
    Number(area),
    Number(rainfall),
    Number(fertilizer),
    Number(pesticide),
  ]);

  const inputTensor = new ort.Tensor(
    "float32",
    inputArray,
    [1, 7]
  );

  const feeds = {
    [session.inputNames[0]]: inputTensor,
  };

  const results = await session.run(feeds);

  const output = results[session.outputNames[0]];

  if (!output || output.data.length === 0) {
    throw new Error("Yield model returned no prediction");
  }

  const predictedYield = Number(output.data[0]);

  if (!Number.isFinite(predictedYield)) {
    throw new Error("Yield model returned an invalid prediction");
  }

  return predictedYield;
}

/*
 * ---------------------------------------------------------
 * PROFIT ESTIMATION
 * ---------------------------------------------------------
 */

export function estimateProfit(
  predictedYield,
  marketPricePerQuintal = 1900,
  areaInAcres = 4.2,
  costPerAcre = 15000
) {
  const yieldValue = Number(predictedYield);
  const marketPrice = Number(marketPricePerQuintal);
  const area = Number(areaInAcres);
  const cost = Number(costPerAcre);

  if (
    !Number.isFinite(yieldValue) ||
    !Number.isFinite(marketPrice) ||
    !Number.isFinite(area) ||
    !Number.isFinite(cost)
  ) {
    throw new Error("Invalid values supplied for profit calculation");
  }

  const revenue = yieldValue * marketPrice;
  const totalCost = cost * area;

  return revenue - totalCost;
}

/*
 * ---------------------------------------------------------
 * YIELD FACTORS
 * ---------------------------------------------------------
 */

export async function getYieldFactors() {
  const response = await fetch(
    "/models/yield_factors.json"
  );

  if (!response.ok) {
    throw new Error("Failed to load yield factors");
  }

  return response.json();
}