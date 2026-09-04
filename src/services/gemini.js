// src/services/gemini.js

import { supabase } from "../lib/supabase";

// =============================================================
// SUPPORTED LANGUAGES
// =============================================================

export const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  bn: "Bengali",
  gu: "Gujarati",
  pa: "Punjabi",
  ml: "Malayalam",
  or: "Odia",
};

// =============================================================
// GENERIC GEMINI CALL
// =============================================================

async function callGemini(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Gemini prompt is required");
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      "ask-gemini",
      {
        body: {
          prompt,
        },
      }
    );

    if (error) {
      console.error("Gemini Edge Function error:", error);
      throw new Error(
        error.message || "Unable to connect to Gemini"
      );
    }

    if (!data) {
      throw new Error("Gemini returned no data");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.text || typeof data.text !== "string") {
      console.error("Invalid Gemini response:", data);
      throw new Error("Gemini returned an empty response");
    }

    return data.text.trim();
  } catch (error) {
    console.error("CALL GEMINI FAILED:", error);
    throw error;
  }
}

// =============================================================
// LANGUAGE HELPER
// =============================================================

function getLanguageName(languageCode = "en") {
  return LANGUAGE_NAMES[languageCode] || "English";
}

// =============================================================
// DISEASE EXPLANATION
// =============================================================

export async function getDiseaseExplanation(
  diseaseName,
  cropName = "",
  preferredLanguage = "en"
) {
  const language = getLanguageName(preferredLanguage);

  const prompt = `
You are KrishiSahayak, a friendly farming assistant helping Indian farmers.

Respond ONLY in ${language}.

Crop: ${cropName || "Unknown"}
Detected disease: ${diseaseName || "Unknown"}

Explain in simple, practical language:

1. What this disease is
2. What commonly causes or encourages it
3. Practical treatment or management steps
4. How to prevent it in the future

Important safety rules:
- Do not invent pesticide names.
- Do not invent pesticide dosages.
- Do not invent application schedules.
- If chemical treatment may be appropriate, tell the farmer to follow the product label and consult a local agricultural officer.
- Do not present an AI diagnosis as completely certain.
- If the diagnosis may be uncertain, clearly say that the farmer should verify it with a local agricultural expert.

Keep the answer short and easy to understand.
`;

  return callGemini(prompt);
}

// =============================================================
// AI COPILOT CHAT
// =============================================================

export async function getChatResponse(
  question,
  preferredLanguage = "en"
) {
  if (!question?.trim()) {
    throw new Error("Question is required");
  }

  const language = getLanguageName(preferredLanguage);

  const prompt = `
You are KrishiSahayak, a friendly farming assistant helping Indian farmers.

The farmer's preferred language is ${language}.

IMPORTANT LANGUAGE RULE:
Respond ONLY in ${language}.
Do not switch to English unless the farmer explicitly asks for English.

The farmer may ask about:
- Crops
- Diseases
- Pests
- Weather
- Irrigation
- Fertilizer
- Yield
- Farming practices
- Market prices
- Mandi-related questions
- General agricultural problems

Keep answers:
- Simple
- Practical
- Short
- Easy to understand
- Suitable for a farmer without technical knowledge

Important:
- Do not invent weather information.
- Do not invent market prices.
- Do not invent disease diagnoses.
- Do not invent pesticide dosages.
- If a chemical treatment is discussed, tell the farmer to follow the product label and consult a local agricultural officer.
- If you do not have enough information, say so instead of making up facts.

If the question is not related to farming, politely explain that KrishiSahayak is mainly designed for farming-related questions.

Farmer's question:
${question}
`;

  return callGemini(prompt);
}

// =============================================================
// ACTION PLAN
// =============================================================

function identifyRisks(weatherData) {
  const risks = [];

  const rainProbability = Number(weatherData?.rainProbability);
  const humidity = Number(weatherData?.humidity);
  const temperature = Number(weatherData?.temperature);

  if (Number.isFinite(rainProbability) && rainProbability > 70) {
    risks.push("heavy_rain");
  }

  if (Number.isFinite(humidity) && humidity > 80) {
    risks.push("high_humidity_fungal_risk");
  }

  if (Number.isFinite(temperature) && temperature > 38) {
    risks.push("heat_stress");
  }

  return risks;
}

export async function getActionPlan(
  weatherData = {},
  crops = [],
  activeAlerts = [],
  preferredLanguage = "en"
) {
  const language = getLanguageName(preferredLanguage);

  const risks = identifyRisks(weatherData);

  const cropList = Array.isArray(crops)
    ? crops
        .map(
          (crop) =>
            `${crop?.name || "Unknown"} (${Number(crop?.acres) || 0} acres)`
        )
        .join(", ")
    : "";

  const prompt = `
You are KrishiSahayak, a farming assistant helping Indian farmers plan their day.

Respond ONLY in ${language}.

Use ONLY the information supplied below.

Weather data:
${JSON.stringify(weatherData)}

Already identified risks:
${risks.join(", ") || "none"}

Farmer's crops:
${cropList || "No crops provided"}

Active alerts:
${Array.isArray(activeAlerts)
  ? activeAlerts.join(", ") || "none"
  : "none"}

Do not invent weather data, crop information, prices, pests, or risks.

Return ONLY valid JSON.

Use exactly this structure:

{
  "summary": "2-3 short sentences describing the most important actions for today",
  "cropCards": [
    {
      "crop": "crop name",
      "riskLevel": "High Risk",
      "impacts": [
        {
          "type": "rain",
          "title": "short title",
          "description": "one short sentence"
        }
      ],
      "yourAction": "one clear practical action"
    }
  ]
}

Allowed riskLevel values:
- High Risk
- Monitor
- Action Needed
- All Good

Allowed impact types:
- rain
- pest
- price
- heat

Include one cropCard for every crop provided.

Keep all text inside the JSON in ${language}.
`;

  const rawText = await callGemini(prompt);

  const cleanedText = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Invalid Action Plan JSON:", cleanedText);
    throw new Error("Gemini returned invalid Action Plan data");
  }
}

// =============================================================
// MARKET RECOMMENDATION
// =============================================================

function calculateTrend(priceHistory) {
  if (!Array.isArray(priceHistory) || priceHistory.length < 2) {
    return "stable";
  }

  const first = Number(priceHistory[0]);
  const last = Number(priceHistory[priceHistory.length - 1]);

  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) {
    return "stable";
  }

  const change = ((last - first) / first) * 100;

  if (change > 3) return "rising";
  if (change < -3) return "falling";

  return "stable";
}

export async function getMarketRecommendation(
  crops = [],
  preferredLanguage = "en"
) {
  const language = getLanguageName(preferredLanguage);

  const safeCrops = Array.isArray(crops) ? crops : [];

  const cropData = safeCrops
    .map((crop) => {
      const history = Array.isArray(crop?.priceHistory)
        ? crop.priceHistory
        : [];

      const trend = calculateTrend(history);

      return `
Crop: ${crop?.name || "Unknown"}
Mandi: ${crop?.mandiName || "Unknown"}
Current price: ₹${Number(crop?.currentPrice) || 0}/quintal
Last 4 weeks: ${history.join(", ") || "No history"}
Calculated trend: ${trend}
`;
    })
    .join("\n");

  const prompt = `
You are KrishiSahayak, a farming assistant helping Indian farmers decide when to sell crops.

Respond ONLY in ${language}.

Below is real price information and an already-calculated price trend.

${cropData || "No crop data supplied."}

IMPORTANT:
- Do not invent prices.
- Do not change the supplied trend.
- Do not claim to know future prices.
- Base the recommendation ONLY on the supplied trend.
- This is guidance, not a guaranteed prediction.

Return ONLY valid JSON in this exact structure:

[
  {
    "crop": "crop name",
    "recommendation": "Sell Today",
    "reason": "short reason based only on the supplied trend"
  }
]

The recommendation can be either:
- "Sell Today"
- "Wait X-Y Days"

Keep all text inside the JSON in ${language}.
`;

  const rawText = await callGemini(prompt);

  const cleanedText = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error(
      "Invalid Market Recommendation JSON:",
      cleanedText
    );

    throw new Error(
      "Gemini returned invalid market recommendation data"
    );
  }
}

// =============================================================
// YIELD / PROFIT EXPLANATION
// =============================================================

export async function getYieldExplanation(
  predictedYield,
  expectedProfit,
  inputs = {},
  preferredLanguage = "en"
) {
  const language = getLanguageName(preferredLanguage);

  const prompt = `
You are KrishiSahayak, a farming assistant helping Indian farmers understand a yield prediction.

Respond ONLY in ${language}.

Input information:

Rainfall: ${Number(inputs?.rainfall) || 0} mm
Fertilizer: ${Number(inputs?.fertilizer) || 0}%

Predicted yield:
${Number(predictedYield).toFixed(2)} quintals

Expected profit:
₹${Number(expectedProfit).toFixed(0)}

Explain this in 2-3 simple sentences.

Your response should:
1. Explain what the prediction means.
2. Mention the expected profit.
3. Give one practical suggestion that may improve the outcome.

Important:
- Do not invent additional numbers.
- Do not claim the prediction is guaranteed.
- Do not make up farming facts.
- Make it clear that the yield prediction is an estimate.

Keep the response simple and practical.
`;

  return callGemini(prompt);
}