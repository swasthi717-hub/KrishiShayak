import * as ort from "onnxruntime-web";

const MODEL_PATH = "/models/plant_disease_model.onnx";
const LABELS_PATH = "/models/labels.json";

const IMAGE_SIZE = 224;
const NUM_CLASSES = 15;
const CONFIDENCE_THRESHOLD = 0.60;

let session = null;
let labels = null;
let loadingPromise = null;

/**
 * Load the ONNX disease model and labels.
 * The model is loaded only once.
 */
export async function loadDiseaseModel() {
  if (session && labels) {
    return;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      console.log("Loading ONNX disease model...");

      // Make sure ONNX Runtime is ready.
      await ort.env.wasm;

      session = await ort.InferenceSession.create(MODEL_PATH, {
        executionProviders: ["wasm"],
      });

      console.log("ONNX disease model loaded.");
      console.log("Model inputs:", session.inputNames);
      console.log("Model outputs:", session.outputNames);

      const labelsResponse = await fetch(LABELS_PATH);

      if (!labelsResponse.ok) {
        throw new Error(
          `Failed to load disease labels: ${labelsResponse.status}`
        );
      }

      const labelsData = await labelsResponse.json();

      /*
       * Support either:
       * ["Disease A", "Disease B", ...]
       *
       * or:
       * { "0": "Disease A", "1": "Disease B", ... }
       */
      if (Array.isArray(labelsData)) {
        labels = labelsData;
      } else if (labelsData && typeof labelsData === "object") {
        labels = Array.from(
          { length: NUM_CLASSES },
          (_, index) => labelsData[String(index)]
        );
      } else {
        throw new Error("Invalid labels.json format.");
      }

      if (labels.length !== NUM_CLASSES) {
        console.warn(
          `Expected ${NUM_CLASSES} disease labels but found ${labels.length}.`
        );
      }

      console.log("Disease labels loaded:", labels);

      return true;
    } catch (error) {
      session = null;
      labels = null;

      console.error("Failed to load ONNX disease model:", error);

      throw new Error(
        `Disease model failed to load: ${error.message || error}`
      );
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Convert an image element into the model's expected
 * [1, 224, 224, 3] Float32 tensor.
 *
 * IMPORTANT:
 * The original model was trained using raw 0-255 pixel values,
 * so we intentionally DO NOT divide by 255.
 */
function preprocessImage(imageElement) {
  const canvas = document.createElement("canvas");

  canvas.width = IMAGE_SIZE;
  canvas.height = IMAGE_SIZE;

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error("Could not create image processing context.");
  }

  context.drawImage(
    imageElement,
    0,
    0,
    IMAGE_SIZE,
    IMAGE_SIZE
  );

  const imageData = context.getImageData(
    0,
    0,
    IMAGE_SIZE,
    IMAGE_SIZE
  );

  const pixels = imageData.data;

  // RGB only — ignore the alpha channel.
  const inputData = new Float32Array(
    IMAGE_SIZE * IMAGE_SIZE * 3
  );

  let offset = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    inputData[offset++] = pixels[i];     // R
    inputData[offset++] = pixels[i + 1]; // G
    inputData[offset++] = pixels[i + 2]; // B
  }

  return new ort.Tensor(
    "float32",
    inputData,
    [1, IMAGE_SIZE, IMAGE_SIZE, 3]
  );
}

/**
 * Convert model output into probabilities if necessary.
 */
function softmax(values) {
  const maxValue = Math.max(...values);

  const exponentials = values.map((value) =>
    Math.exp(value - maxValue)
  );

  const sum = exponentials.reduce(
    (total, value) => total + value,
    0
  );

  return exponentials.map((value) => value / sum);
}

/**
 * Get the numeric output from ONNX Runtime.
 */
function extractOutputData(output) {
  if (!output) {
    throw new Error("Disease model returned no output.");
  }

  if (output.data) {
    return Array.from(output.data);
  }

  if (Array.isArray(output)) {
    return output.map(Number);
  }

  throw new Error("Unsupported ONNX output format.");
}

/**
 * Run disease detection.
 */
export async function detectDisease(imageElement) {
  if (!session || !labels) {
    await loadDiseaseModel();
  }

  if (!imageElement) {
    throw new Error("No image was provided.");
  }

  try {
    const inputTensor = preprocessImage(imageElement);

    const inputName = session.inputNames[0];
    const outputName = session.outputNames[0];

    const results = await session.run({
      [inputName]: inputTensor,
    });

    const rawScores = extractOutputData(results[outputName]);

    if (rawScores.length !== NUM_CLASSES) {
      console.warn(
        `Expected ${NUM_CLASSES} output classes but received ${rawScores.length}.`
      );
    }

    /*
     * The converted model contains a Softmax operation, so normally
     * these values should already be probabilities.
     *
     * If they don't look like probabilities, normalize them with
     * softmax as a safety fallback.
     */
    const looksLikeProbabilities =
      rawScores.every(
        (value) => value >= 0 && value <= 1
      ) &&
      Math.abs(
        rawScores.reduce((sum, value) => sum + value, 0) - 1
      ) < 0.01;

    const probabilities = looksLikeProbabilities
      ? rawScores
      : softmax(rawScores);

    let maxIndex = 0;
    let maxConfidence = probabilities[0];

    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxConfidence) {
        maxConfidence = probabilities[i];
        maxIndex = i;
      }
    }

    const confidencePercent = Number(
      (maxConfidence * 100).toFixed(2)
    );

    const diseaseName =
      labels[maxIndex] || `Class ${maxIndex}`;

    console.log("Disease prediction:", {
      classIndex: maxIndex,
      diseaseName,
      confidence: confidencePercent,
      probabilities,
    });

    if (maxConfidence < CONFIDENCE_THRESHOLD) {
      return {
        diseaseName: "Unknown",
        confidence: confidencePercent,
        confidencePercent,
        classIndex: maxIndex,
      };
    }

    return {
      diseaseName,
      confidence: confidencePercent,
      confidencePercent,
      classIndex: maxIndex,
    };
  } catch (error) {
    console.error("Disease detection failed:", error);

    throw new Error(
      `Disease detection failed: ${error.message || error}`
    );
  }
}

/**
 * Check whether the model is currently loaded.
 */
export function isDiseaseModelLoaded() {
  return Boolean(session && labels);
}