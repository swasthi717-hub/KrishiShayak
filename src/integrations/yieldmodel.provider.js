const env = require("../config/env");
const { ApiError } = require("../utils/errors");

// Interface for the trained yield-prediction model, to be provided later.
// Both the "real prediction" flow and the "what-if simulator" flow call this
// same function with a normalized input snapshot — neither path does its own
// math, so there is exactly one place that needs the real model wired in.
//
//   input:  snapshot (see yieldPrediction.service.js#buildInputSnapshot)
//   output: { predicted_yield: number, predicted_yield_unit: string,
//              estimated_profit: number|null, confidence: number, model_version: string }

async function predict(snapshot) {
  if (!env.yieldModelEndpoint) {
    throw new ApiError(
      503,
      "Yield prediction model is not available yet. The input pipeline and API are fully wired — " +
        "set YIELD_MODEL_ENDPOINT once the trained model is deployed to enable predictions."
    );
  }

  // Example of what the real call will look like once the model is deployed:
  // const axios = require("axios");
  // const { data } = await axios.post(env.yieldModelEndpoint, snapshot, { timeout: 20000 });
  // return normalize(data);

  throw new ApiError(501, "YIELD_MODEL_ENDPOINT is set but no inference call is implemented yet");
}

module.exports = { predict };