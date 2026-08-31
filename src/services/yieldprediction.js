import * as ort from 'onnxruntime-web';

let session = null;
let mappings = null;

export async function loadYieldModel() {
  session = await ort.InferenceSession.create('/models/yield_model.onnx');
  const response = await fetch('/models/mappings.json');
  mappings = await response.json();
}

export async function predictYield({ crop, season, state, area, rainfall, fertilizer, pesticide }) {
  if (!session || !mappings) throw new Error('Yield model not loaded. Call loadYieldModel() first.');

  const cropEncoded = mappings.crop_mapping[crop] ?? 0;
  const seasonEncoded = mappings.season_mapping[season] ?? 0;
  const stateEncoded = mappings.state_mapping[state] ?? 0;

  const inputArray = new Float32Array([
    cropEncoded, seasonEncoded, stateEncoded, area, rainfall, fertilizer, pesticide
  ]);
  const inputTensor = new ort.Tensor('float32', inputArray, [1, 7]);

  const feeds = { [session.inputNames[0]]: inputTensor };
  const results = await session.run(feeds);
  return results[session.outputNames[0]].data[0];
}

export function estimateProfit(predictedYield, marketPricePerQuintal, areaInAcres = 1, costPerAcre = 15000) {
  const revenue = predictedYield * marketPricePerQuintal;
  const totalCost = costPerAcre * areaInAcres;
  return revenue - totalCost;
}

export async function getYieldFactors() {
  const response = await fetch('/models/yield_factors.json');
  return response.json();
}