import * as ort from "onnxruntime-web";

let session = null;
let mappings = null;
let loadingPromise = null;

// =============================================================
// MODEL FILES
// =============================================================

const MODEL_PATH =
  "/models/yield_model_farmer.onnx";

const MAPPINGS_PATH =
  "/models/mappings_farmer.json";

// IndexedDB settings
const MODEL_DB_NAME =
  "krishisahayak-model-cache";

const MODEL_DB_VERSION = 1;

const MODEL_STORE_NAME =
  "models";

const MODEL_CACHE_KEY =
  "yield_model_farmer_v1";

// 1 acre = 0.404686 hectares
const ACRES_TO_HECTARES =
  0.404686;

// =============================================================
// ALIASES
// =============================================================

const cropAliases = {
  Cotton: "Cotton(lint)",
  "Moong (Green Gram)":
    "Moong(Green Gram)",
  "Rapeseed & Mustard":
    "Rapeseed &Mustard",
};

// =============================================================
// INDEXEDDB HELPERS
// =============================================================

function openModelDatabase() {
  return new Promise(
    (resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(
          new Error(
            "IndexedDB is not supported by this browser"
          )
        );
        return;
      }

      const request =
        indexedDB.open(
          MODEL_DB_NAME,
          MODEL_DB_VERSION
        );

      request.onupgradeneeded =
        () => {
          const db = request.result;

          if (
            !db.objectStoreNames.contains(
              MODEL_STORE_NAME
            )
          ) {
            db.createObjectStore(
              MODEL_STORE_NAME
            );
          }
        };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(
          request.error ||
            new Error(
              "Unable to open IndexedDB"
            )
        );
      };
    }
  );
}

async function getCachedModel() {
  let db;

  try {
    db =
      await openModelDatabase();

    return await new Promise(
      (resolve, reject) => {
        const transaction =
          db.transaction(
            MODEL_STORE_NAME,
            "readonly"
          );

        const store =
          transaction.objectStore(
            MODEL_STORE_NAME
          );

        const request =
          store.get(
            MODEL_CACHE_KEY
          );

        request.onsuccess =
          () => {
            resolve(
              request.result ||
                null
            );
          };

        request.onerror =
          () => {
            reject(
              request.error ||
                new Error(
                  "Unable to read cached model"
                )
            );
          };

        transaction.oncomplete =
          () => {
            db.close();
          };

        transaction.onerror =
          () => {
            db.close();
          };
      }
    );
  } catch (error) {
    console.warn(
      "IndexedDB read failed. Will use network:",
      error
    );

    if (db) {
      db.close();
    }

    return null;
  }
}

async function cacheModel(
  modelBuffer
) {
  let db;

  try {
    db =
      await openModelDatabase();

    await new Promise(
      (resolve, reject) => {
        const transaction =
          db.transaction(
            MODEL_STORE_NAME,
            "readwrite"
          );

        const store =
          transaction.objectStore(
            MODEL_STORE_NAME
          );

        const request =
          store.put(
            modelBuffer,
            MODEL_CACHE_KEY
          );

        request.onsuccess =
          () => {
            resolve();
          };

        request.onerror =
          () => {
            reject(
              request.error ||
                new Error(
                  "Unable to cache model"
                )
            );
          };

        transaction.oncomplete =
          () => {
            db.close();
          };

        transaction.onerror =
          () => {
            reject(
              transaction.error ||
                new Error(
                  "IndexedDB transaction failed"
                )
            );

            db.close();
          };
      }
    );

    console.log(
      "Yield model cached successfully in IndexedDB"
    );
  } catch (error) {
    console.warn(
      "Unable to cache yield model. Continuing without persistent cache:",
      error
    );

    if (db) {
      db.close();
    }
  }
}

// =============================================================
// LOAD MODEL BYTES
// =============================================================

async function getModelBytes() {
  // -----------------------------------------------------------
  // Try IndexedDB first
  // -----------------------------------------------------------

  const cachedModel =
    await getCachedModel();

  if (cachedModel) {
    console.log(
      "Using cached farmer yield model from IndexedDB"
    );

    return cachedModel;
  }

  // -----------------------------------------------------------
  // No cached model → download from server
  // -----------------------------------------------------------

  console.log(
    "Yield model not found in IndexedDB. Downloading model..."
  );

  const response =
    await fetch(
      MODEL_PATH,
      {
        cache: "force-cache",
      }
    );

  if (!response.ok) {
    throw new Error(
      `Unable to download yield model (${response.status})`
    );
  }

  const modelBuffer =
    await response.arrayBuffer();

  console.log(
    `Yield model downloaded: ${(
      modelBuffer.byteLength /
      (1024 * 1024)
    ).toFixed(2)} MB`
  );

  // -----------------------------------------------------------
  // Save a copy to IndexedDB for future visits
  // -----------------------------------------------------------

  await cacheModel(
    modelBuffer
  );

  return modelBuffer;
}

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

  loadingPromise =
    (async () => {
      try {
        console.log(
          "Loading farmer yield ONNX model..."
        );

        // -----------------------------------------------------
        // Load model + mappings concurrently
        // -----------------------------------------------------

        const [
          modelBuffer,
          mappingsResponse,
        ] = await Promise.all([
          getModelBytes(),

          fetch(
            MAPPINGS_PATH,
            {
              cache:
                "force-cache",
            }
          ),
        ]);

        // -----------------------------------------------------
        // Validate mappings response
        // -----------------------------------------------------

        if (!mappingsResponse.ok) {
          throw new Error(
            `Unable to load mappings_farmer.json (${mappingsResponse.status})`
          );
        }

        const loadedMappings =
          await mappingsResponse.json();

        if (
          !loadedMappings?.crop_mapping
        ) {
          throw new Error(
            "mappings_farmer.json is missing crop_mapping"
          );
        }

        if (
          !loadedMappings?.season_mapping
        ) {
          throw new Error(
            "mappings_farmer.json is missing season_mapping"
          );
        }

        if (
          !loadedMappings?.state_mapping
        ) {
          throw new Error(
            "mappings_farmer.json is missing state_mapping"
          );
        }

        // -----------------------------------------------------
        // Create ONNX session from cached/downloaded bytes
        //
        // IMPORTANT:
        // Keep WASM only for now.
        // -----------------------------------------------------

        const loadedSession =
          await ort.InferenceSession.create(
            modelBuffer,
            {
              executionProviders: [
                "wasm",
              ],
            }
          );

        // -----------------------------------------------------
        // Store loaded resources in memory
        // -----------------------------------------------------

        session =
          loadedSession;

        mappings =
          loadedMappings;

        console.log(
          "Farmer yield model loaded successfully"
        );

        console.log(
          "Input names:",
          session.inputNames
        );

        console.log(
          "Output names:",
          session.outputNames
        );

        console.log(
          "Input metadata:",
          session.inputMetadata
        );

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
            error instanceof Error
              ? error.message
              : error
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

  const numericAreaAcres =
    Number(area);

  const numericRainfall =
    Number(rainfall);

  if (
    !Number.isFinite(
      numericAreaAcres
    ) ||
    numericAreaAcres <= 0
  ) {
    throw new Error(
      "Invalid farm area"
    );
  }

  if (
    !Number.isFinite(
      numericRainfall
    ) ||
    numericRainfall < 0
  ) {
    throw new Error(
      "Invalid rainfall"
    );
  }

  // -----------------------------------------------------------
  // Convert acres -> hectares
  //
  // The model was trained using Area in hectares.
  // -----------------------------------------------------------

  const numericAreaHectares =
    numericAreaAcres *
    ACRES_TO_HECTARES;

  // -----------------------------------------------------------
  // Map categorical values
  // -----------------------------------------------------------

  const cropKey =
    cropAliases[crop] ||
    crop;

  const cropEncoded =
    Number(
      mappings.crop_mapping?.[
        cropKey
      ]
    );

  const seasonEncoded =
    Number(
      mappings.season_mapping?.[
        season
      ]
    );

  const stateEncoded =
    Number(
      mappings.state_mapping?.[
        state
      ]
    );

  // -----------------------------------------------------------
  // Debug information
  // -----------------------------------------------------------

  console.log(
    "Farmer yield prediction inputs:",
    {
      crop,
      season,
      state,
      areaAcres:
        numericAreaAcres,
      areaHectares:
        numericAreaHectares,
      rainfall:
        numericRainfall,
    }
  );

  console.log(
    "Mapped values:",
    {
      crop: {
        original: crop,
        mapped: cropKey,
        encoded:
          cropEncoded,
      },

      season: {
        original: season,
        encoded:
          seasonEncoded,
      },

      state: {
        original: state,
        encoded:
          stateEncoded,
      },
    }
  );

  // -----------------------------------------------------------
  // Validate mappings
  // -----------------------------------------------------------

  if (
    !Number.isFinite(
      cropEncoded
    )
  ) {
    throw new Error(
      `Crop "${crop}" is not present in mappings_farmer.json`
    );
  }

  if (
    !Number.isFinite(
      seasonEncoded
    )
  ) {
    throw new Error(
      `Season "${season}" is not present in mappings_farmer.json`
    );
  }

  if (
    !Number.isFinite(
      stateEncoded
    )
  ) {
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

  const inputArray =
    new Float32Array([
      cropEncoded,
      seasonEncoded,
      stateEncoded,
      numericAreaHectares,
      numericRainfall,
    ]);

  console.log(
    "Farmer ONNX input array:",
    Array.from(
      inputArray
    )
  );

  const inputTensor =
    new ort.Tensor(
      "float32",
      inputArray,
      [1, 5]
    );

  // -----------------------------------------------------------
  // Get model input/output names
  // -----------------------------------------------------------

  const inputName =
    session.inputNames[0];

  const outputName =
    session.outputNames[0];

  if (
    !inputName ||
    !outputName
  ) {
    throw new Error(
      "Yield model does not expose expected input/output tensors"
    );
  }

  // -----------------------------------------------------------
  // Run model
  // -----------------------------------------------------------

  const results =
    await session.run({
      [inputName]:
        inputTensor,
    });

  const output =
    results[outputName];

  if (
    !output?.data?.length
  ) {
    throw new Error(
      "Yield model returned no prediction"
    );
  }

  // -----------------------------------------------------------
  // Convert log1p prediction back to original scale
  // -----------------------------------------------------------

  const predictionLog =
    Number(
      output.data[0]
    );

  if (
    !Number.isFinite(
      predictionLog
    )
  ) {
    throw new Error(
      "Yield model returned an invalid prediction"
    );
  }

  const predictedYield =
    Math.expm1(
      predictionLog
    );

  if (
    !Number.isFinite(
      predictedYield
    ) ||
    predictedYield < 0
  ) {
    throw new Error(
      "Yield model produced an invalid final prediction"
    );
  }

  console.log(
    "Raw ONNX output:",
    predictionLog
  );

  console.log(
    "Final predicted yield:",
    predictedYield
  );

  return predictedYield;
}

// =============================================================
// PROFIT ESTIMATION
// =============================================================

export function estimateProfit(
  predictedYield,
  marketPricePerQuintal = 1900,
  areaInAcres = 4.2,
  costPerAcre = 15000
) {
  const yieldValue =
    Number(
      predictedYield
    );

  const price =
    Number(
      marketPricePerQuintal
    );

  const area =
    Number(
      areaInAcres
    );

  const cost =
    Number(
      costPerAcre
    );

  if (
    !Number.isFinite(
      yieldValue
    ) ||
    !Number.isFinite(
      price
    ) ||
    !Number.isFinite(
      area
    ) ||
    !Number.isFinite(
      cost
    )
  ) {
    throw new Error(
      "Invalid values supplied for profit calculation"
    );
  }

  /*
   * Keep this calculation unchanged for now.
   *
   * The exact unit of Yield_farmer still needs to be confirmed
   * before using it with a quintal market price.
   */

  const revenue =
    yieldValue * price;

  const totalCost =
    cost * area;

  const profit =
    revenue -
    totalCost;

  console.log(
    "Profit calculation:",
    {
      predictedYield:
        yieldValue,

      marketPricePerQuintal:
        price,

      areaInAcres:
        area,

      costPerAcre:
        cost,

      revenue,

      totalCost,

      profit,
    }
  );

  if (
    !Number.isFinite(
      profit
    )
  ) {
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
  const response =
    await fetch(
      "/models/yield_factors.json",
      {
        cache:
          "force-cache",
      }
    );

  if (!response.ok) {
    throw new Error(
      `Unable to load yield factors (${response.status})`
    );
  }

  return response.json();
}