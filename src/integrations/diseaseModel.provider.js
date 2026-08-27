const env = require("../config/env");
const { ApiError } = require("../utils/errors");

// Interface for the trained crop-disease model. The model file/endpoint does
// not exist yet. This is intentionally NOT a mock — it throws a clear 503
// until DISEASE_MODEL_ENDPOINT is configured, so the API contract below is
// what the real model integration should satisfy:
//
//   input:  { buffer: Buffer, mimetype: string }
//   output: { disease: string, confidence: number (0-1), severity: "mild"|"moderate"|"severe", model_version: string }

async function predict({ buffer, mimetype }) {
  if (!env.diseaseModelEndpoint) {
    throw new ApiError(
      503,
      "Disease detection model is not available yet. The scan/history pipeline is fully wired — " +
        "set DISEASE_MODEL_ENDPOINT once the trained model is deployed to enable predictions."
    );
  }

  // Example of what the real call will look like once the model is deployed:
  // const axios = require("axios");
  // const { data } = await axios.post(env.diseaseModelEndpoint, buffer, {
  //   headers: { "Content-Type": mimetype },
  //   timeout: 20000,
  // });
  // return normalize(data);

  throw new ApiError(501, "DISEASE_MODEL_ENDPOINT is set but no inference call is implemented yet");
}

module.exports = { predict };