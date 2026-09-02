import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import * as tflite from "@tensorflow/tfjs-tflite";

let model = null;
let labels = null;
let loadingPromise = null;

const CONFIDENCE_THRESHOLD = 0.60;

const MODEL_PATH = "/models/plant_disease_model.tflite";
const LABELS_PATH = "/models/labels.json";

/**
 * Load labels.json safely.
 */
async function loadLabels() {
  const response = await fetch(LABELS_PATH, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Could not load labels.json (${response.status} ${response.statusText})`
    );
  }

  const data = await response.json();

  /*
   * Support either:
   *
   * ["Healthy", "Early Blight", "Late Blight"]
   *
   * OR:
   *
   * {
   *   "0": "Healthy",
   *   "1": "Early Blight",
   *   "2": "Late Blight"
   * }
   */
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object") {
    return Object.keys(data)
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => data[key]);
  }

  throw new Error("labels.json has an unsupported format.");
}

/**
 * Load the TFLite disease model once.
 */
export async function loadDiseaseModel() {
  if (model && labels) {
    return {
      model,
      labels,
    };
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      console.log("Loading disease detection model...");

      /*
       * tfjs-tflite runs its own TFLite WASM runtime.
       *
       * We still initialize TFJS because it is used to create
       * the input tensor.
       */
      await tf.ready();

      console.log("TensorFlow.js backend:", tf.getBackend());

      /*
       * Load the TFLite model.
       */
      const loadedModel = await tflite.loadTFLiteModel(MODEL_PATH, {
        numThreads: Math.max(
          1,
          Math.min(
            4,
            Math.floor((navigator.hardwareConcurrency || 2) / 2)
          )
        ),
      });

      /*
       * Load class labels.
       */
      const loadedLabels = await loadLabels();

      if (!loadedLabels.length) {
        throw new Error("No disease labels were found.");
      }

      model = loadedModel;
      labels = loadedLabels;

      console.log("Disease model loaded successfully.");
      console.log("Disease labels:", labels);

      /*
       * Print model information when available.
       * This is extremely useful if input dimensions are wrong.
       */
      if (model.inputs) {
        console.log("Disease model inputs:", model.inputs);
      }

      if (model.outputs) {
        console.log("Disease model outputs:", model.outputs);
      }

      return {
        model,
        labels,
      };
    } catch (error) {
      model = null;
      labels = null;

      console.error("Disease model loading failed:", error);

      throw new Error(
        error?.message ||
          "Unable to load the plant disease detection model."
      );
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Convert an image into the format expected by the model.
 *
 * IMPORTANT:
 * This keeps your original preprocessing:
 *
 * - 224 x 224
 * - float32
 * - raw 0-255 pixels
 *
 * Do NOT change this to /255 unless the model was trained
 * using normalized 0-1 input.
 */
function preprocessImage(imageElement) {
  return tf.tidy(() => {
    const image = tf.browser.fromPixels(imageElement);

    const resized = tf.image.resizeBilinear(image, [224, 224]);

    return resized.toFloat().expandDims(0);
  });
}

/**
 * Convert the model output into a simple Float32Array.
 */
async function getPredictionData(output) {
  if (!output) {
    throw new Error("Disease model returned no output.");
  }

  /*
   * Single Tensor output.
   */
  if (typeof output.data === "function") {
    return new Float32Array(await output.data());
  }

  /*
   * Multiple output tensors.
   */
  if (Array.isArray(output)) {
    if (!output.length) {
      throw new Error("Disease model returned an empty output array.");
    }

    return new Float32Array(await output[0].data());
  }

  /*
   * Named TensorMap output.
   */
  if (typeof output === "object") {
    const firstKey = Object.keys(output)[0];

    if (!firstKey || !output[firstKey]) {
      throw new Error("Disease model returned an invalid output.");
    }

    return new Float32Array(await output[firstKey].data());
  }

  throw new Error("Unsupported disease model output format.");
}

/**
 * Run disease classification.
 */
export async function detectDisease(imageElement) {
  if (!imageElement) {
    throw new Error("No image was provided for disease analysis.");
  }

  /*
   * Automatically load the model if the page forgot to load it first.
   */
  if (!model || !labels) {
    await loadDiseaseModel();
  }

  let input = null;
  let output = null;

  try {
    input = preprocessImage(imageElement);

    console.log("Disease model input shape:", input.shape);

    /*
     * Run TFLite inference.
     */
    output = model.predict(input);

    const predictions = await getPredictionData(output);

    if (!predictions.length) {
      throw new Error("Disease model returned no predictions.");
    }

    console.log(
      "Disease model predictions:",
      Array.from(predictions)
    );

    /*
     * Find highest probability.
     */
    let maxIndex = 0;
    let maxConfidence = Number(predictions[0]);

    for (let i = 1; i < predictions.length; i++) {
      const value = Number(predictions[i]);

      if (value > maxConfidence) {
        maxConfidence = value;
        maxIndex = i;
      }
    }

    /*
     * Handle invalid model output.
     */
    if (!Number.isFinite(maxConfidence)) {
      throw new Error("Disease model returned an invalid confidence.");
    }

    /*
     * Some models return logits instead of probabilities.
     *
     * If values are outside the 0-1 range, convert them to
     * probabilities using softmax.
     */
    let probabilities = Array.from(predictions);

    const hasProbabilityRange = probabilities.every(
      (value) => value >= 0 && value <= 1
    );

    if (!hasProbabilityRange) {
      const logitsTensor = tf.tensor1d(probabilities);

      const softmaxTensor = tf.softmax(logitsTensor);

      probabilities = Array.from(await softmaxTensor.data());

      logitsTensor.dispose();
      softmaxTensor.dispose();

      maxIndex = 0;
      maxConfidence = probabilities[0];

      for (let i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > maxConfidence) {
          maxConfidence = probabilities[i];
          maxIndex = i;
        }
      }
    }

    const confidencePercent = Number(
      (maxConfidence * 100).toFixed(2)
    );

    /*
     * If confidence is too low, don't pretend we know the disease.
     */
    if (maxConfidence < CONFIDENCE_THRESHOLD) {
      return {
        diseaseName: "Unknown",
        confidence: confidencePercent,
        classIndex: maxIndex,
      };
    }

    const diseaseName =
      labels[maxIndex] ?? `Class ${maxIndex}`;

    return {
      diseaseName,
      confidence: confidencePercent,
      classIndex: maxIndex,
    };
  } catch (error) {
    console.error("Disease detection failed:", error);

    throw new Error(
      error?.message ||
        "Unable to analyse this leaf image."
    );
  } finally {
    /*
     * Dispose input tensor.
     */
    if (input) {
      input.dispose();
    }

    /*
     * Dispose output tensor(s).
     */
    if (output) {
      if (typeof output.dispose === "function") {
        output.dispose();
      } else if (Array.isArray(output)) {
        output.forEach((tensor) => {
          if (tensor?.dispose) {
            tensor.dispose();
          }
        });
      } else if (typeof output === "object") {
        Object.values(output).forEach((tensor) => {
          if (tensor?.dispose) {
            tensor.dispose();
          }
        });
      }
    }
  }
}

/**
 * Optional helper for debugging from the browser console.
 */
export function isDiseaseModelLoaded() {
  return Boolean(model && labels);
}