import * as tf from '@tensorflow/tfjs';
import * as tflite from '@tensorflow/tfjs-tflite';

let model = null;
let labels = null;
const CONFIDENCE_THRESHOLD = 0.60;
export async function loadDiseaseModel() {
  // NOTE: tfjs-tflite uses its own WASM/XNNPACK runtime —
  // manual WebGPU/WebGL backend selection is not applicable here.
  model = await tflite.loadTFLiteModel('/models/plant_disease_model.tflite');
  const response = await fetch('/models/labels.json');
  labels = await response.json();
}

function preprocessImage(imageElement) {
  return tf.tidy(() => {
    return tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      // NO division by 255 — matches actual Colab training, which used raw 0-255 pixel values
      .expandDims(0);
  });
}

export async function detectDisease(imageElement) {
  if (!model || !labels) throw new Error('Model not loaded. Call loadDiseaseModel() first.');

  const input = preprocessImage(imageElement);
  const output = model.predict(input);
  const predictions = await output.data();

  let maxIndex = 0, maxConfidence = predictions[0];
  for (let i = 1; i < predictions.length; i++) {
    if (predictions[i] > maxConfidence) {
      maxConfidence = predictions[i];
      maxIndex = i;
    }
  }

  input.dispose();
  output.dispose();

  if (maxConfidence < CONFIDENCE_THRESHOLD) {
    return { diseaseName: 'Unknown', confidence: Number((maxConfidence * 100).toFixed(2)) };
  }

  return {
    diseaseName: labels[maxIndex],
    confidence: Number((maxConfidence * 100).toFixed(2))
  };
}