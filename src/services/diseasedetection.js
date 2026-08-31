import * as tf from '@tensorflow/tfjs';
import * as tflite from '@tensorflow/tfjs-tflite';

let model = null;
let labels = null;

async function setupBackend() {
  try {
    await tf.setBackend('webgpu');
    await tf.ready();
  } catch (e) {
    await tf.setBackend('webgl');
    await tf.ready();
  }
}

export async function loadDiseaseModel() {
  await setupBackend();
  model = await tflite.loadTFLiteModel('/models/plant_disease_model.tflite');
  const response = await fetch('/models/labels.json');
  labels = await response.json();
}

function preprocessImage(imageElement) {
  return tf.tidy(() => {
    return tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .div(255.0)
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

  const diseaseName = labels[maxIndex];
  const confidence = parseFloat((maxConfidence * 100).toFixed(2));

  input.dispose();
  output.dispose();

  return { diseaseName, confidence };
}