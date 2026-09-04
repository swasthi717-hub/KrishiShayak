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
    const { data, error } =
      await supabase.functions.invoke(
        "ask-gemini",
        {
          body: {
            prompt,
          },
        }
      );

    if (error) {
      console.error(
        "Gemini Edge Function error:",
        error
      );

      throw new Error(
        error.message ||
          "Unable to connect to Gemini"
      );
    }

    if (!data) {
      throw new Error(
        "Gemini returned no data"
      );
    }

    if (data.error) {
      throw new Error(data.error);
    }

    if (
      !data.text ||
      typeof data.text !== "string"
    ) {
      console.error(
        "Invalid Gemini response:",
        data
      );

      throw new Error(
        "Gemini returned an empty response"
      );
    }

    return data.text.trim();
  } catch (error) {
    console.error(
      "CALL GEMINI FAILED:",
      error
    );

    throw error;
  }
}

// =============================================================
// LANGUAGE HELPER
// =============================================================

function getLanguageName(
  languageCode = "en"
) {
  return (
    LANGUAGE_NAMES[languageCode] ||
    "English"
  );
}

// =============================================================
// DISEASE EXPLANATION
// =============================================================

export async function getDiseaseExplanation(
  diseaseName,
  cropName = "",
  preferredLanguage = "en"
) {
  const language =
    getLanguageName(preferredLanguage);

  const prompt = `
You are KrishiShayak, a friendly farming assistant helping Indian farmers.

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
// WEATHER CONTEXT FORMATTER
// =============================================================

function createWeatherContext(weather) {
  if (!weather) {
    return {
      available: false,
      message:
        "Live weather data is not available.",
    };
  }

  const current = weather?.current || {};
  const daily = weather?.daily || {};

  const forecast = [];

  const dates = daily?.time || [];

  for (
    let i = 0;
    i < Math.min(dates.length, 7);
    i++
  ) {
    forecast.push({
      date: dates[i],

      maxTemperature:
        daily?.temperature_2m_max?.[i] ??
        null,

      minTemperature:
        daily?.temperature_2m_min?.[i] ??
        null,

      precipitationProbability:
        daily
          ?.precipitation_probability_max?.[
          i
        ] ?? null,

      precipitation:
        daily?.precipitation_sum?.[i] ??
        null,

      weatherCode:
        daily?.weather_code?.[i] ??
        null,
    });
  }

  return {
    available: true,

    source: "Open-Meteo",

    timezone:
      weather?.timezone || null,

    current: {
      temperature:
        current?.temperature_2m ?? null,

      apparentTemperature:
        current?.apparent_temperature ??
        null,

      humidity:
        current?.relative_humidity_2m ??
        null,

      precipitation:
        current?.precipitation ?? null,

      windSpeed:
        current?.wind_speed_10m ?? null,

      weatherCode:
        current?.weather_code ?? null,
    },

    forecast,
  };
}

// =============================================================
// MANDI CONTEXT FORMATTER
// =============================================================

function createMandiContext(mandi) {
  if (!mandi) {
    return {
      available: false,
      message:
        "No mandi data was requested for this question.",
    };
  }

  const records = Array.isArray(
    mandi?.records
  )
    ? mandi.records
    : [];

  if (records.length === 0) {
    return {
      available: false,
      message:
        "The mandi API returned no matching records.",
    };
  }

  return {
    available: true,

    source:
      "data.gov.in agricultural mandi data",

    totalRecords:
      mandi?.total ?? records.length,

    records: records.slice(0, 30).map(
      (record) => ({
        state:
          record?.state || "",

        district:
          record?.district || "",

        market:
          record?.market || "",

        commodity:
          record?.commodity || "",

        variety:
          record?.variety || "",

        grade:
          record?.grade || "",

        minPrice:
          record?.min_price ?? null,

        maxPrice:
          record?.max_price ?? null,

        modalPrice:
          record?.modal_price ?? null,

        arrivalDate:
          record?.arrival_date || "",
      })
    ),
  };
}

// =============================================================
// AI COPILOT CHAT
// =============================================================

export async function getChatResponse(
  question,
  preferredLanguage = "en",
  context = {}
) {
  if (!question?.trim()) {
    throw new Error(
      "Question is required"
    );
  }

  const language =
    getLanguageName(preferredLanguage);

  const weatherContext =
    createWeatherContext(
      context?.weather
    );

  const mandiContext =
    createMandiContext(
      context?.mandi
    );

  const locationContext =
    context?.location || {};

  const prompt = `
You are KrishiShayak, a friendly farming assistant helping Indian farmers.

Your job is to answer the farmer using the REAL DATA supplied below.

============================================================
FARMER QUESTION
============================================================

${question}

============================================================
FARMER LOCATION
============================================================

${JSON.stringify(
  locationContext,
  null,
  2
)}

============================================================
LIVE WEATHER DATA
============================================================

${JSON.stringify(
  weatherContext,
  null,
  2
)}

============================================================
LIVE MANDI DATA
============================================================

${JSON.stringify(
  mandiContext,
  null,
  2
)}

============================================================
LANGUAGE
============================================================

Respond ONLY in ${language}.

============================================================
IMPORTANT DATA RULES
============================================================

1. The weather information above comes from a live weather API.

2. The mandi information above comes from the supplied mandi API data.

3. NEVER invent a weather value.

4. NEVER invent a mandi price.

5. NEVER claim that a future market price is known.

6. If mandi data is unavailable, explicitly say that current mandi data was not available.

7. If weather data is unavailable, explicitly say that live weather data was not available.

8. Use the farmer's location when it is relevant.

9. If the farmer asks "today", use the supplied current/live data rather than making up information.

10. If the farmer asks about selling a crop, use the supplied mandi records when available.

11. If several mandi records are available, compare their prices and markets rather than choosing a market without evidence.

12. Do not confuse min price, max price, and modal price.

13. Do not invent pesticide names or dosages.

14. If chemical treatment is discussed, tell the farmer to follow the product label and consult a local agricultural officer.

15. Do not present an AI disease diagnosis as completely certain.

16. If there is insufficient information, say so instead of making up facts.

============================================================
ANSWER STYLE
============================================================

Keep the answer:
- Simple
- Practical
- Short
- Farmer-friendly
- Easy to understand

Use bullet points when helpful.

If the question is unrelated to farming, politely explain that KrishiShayak is mainly designed for farming-related questions.

============================================================
EXAMPLE OF HOW TO USE DATA
============================================================

If the farmer asks:
"आज बारिश होगी क्या?"

Use the supplied weather forecast.

If the farmer asks:
"आज प्याज बेचना सही है?"

Use the supplied onion mandi records and their actual prices.

If the farmer asks:
"मेरे खेत में अभी क्या करना चाहिए?"

Use the farmer's location and current/forecast weather when relevant.

Do NOT make up missing information.

============================================================
FINAL ANSWER
============================================================
`;

  return callGemini(prompt);
}

// =============================================================
// ACTION PLAN
// =============================================================

function identifyRisks(weatherData) {
  const risks = [];

  const rainProbability = Number(
    weatherData?.rainProbability
  );

  const humidity = Number(
    weatherData?.humidity
  );

  const temperature = Number(
    weatherData?.temperature
  );

  if (
    Number.isFinite(rainProbability) &&
    rainProbability > 70
  ) {
    risks.push("heavy_rain");
  }

  if (
    Number.isFinite(humidity) &&
    humidity > 80
  ) {
    risks.push(
      "high_humidity_fungal_risk"
    );
  }

  if (
    Number.isFinite(temperature) &&
    temperature > 38
  ) {
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
  const language =
    getLanguageName(preferredLanguage);

  const risks =
    identifyRisks(weatherData);

  const cropList = Array.isArray(crops)
    ? crops
        .map(
          (crop) =>
            `${crop?.name || "Unknown"} (${Number(crop?.acres) || 0} acres)`
        )
        .join(", ")
    : "";

  const prompt = `
You are KrishiShayak, a farming assistant helping Indian farmers plan their day.

Respond ONLY in ${language}.

Use ONLY the information supplied below.

Weather data:
${JSON.stringify(weatherData)}

Already identified risks:
${risks.join(", ") || "none"}

Farmer's crops:
${cropList || "No crops provided"}

Active alerts:
${
  Array.isArray(activeAlerts)
    ? activeAlerts.join(", ") ||
      "none"
    : "none"
}

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

  const rawText =
    await callGemini(prompt);

  const cleanedText = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error(
      "Invalid Action Plan JSON:",
      cleanedText
    );

    throw new Error(
      "Gemini returned invalid Action Plan data"
    );
  }
}

// =============================================================
// MARKET RECOMMENDATION
// =============================================================

function calculateTrend(priceHistory) {
  if (
    !Array.isArray(priceHistory) ||
    priceHistory.length < 2
  ) {
    return "stable";
  }

  const first = Number(
    priceHistory[0]
  );

  const last = Number(
    priceHistory[
      priceHistory.length - 1
    ]
  );

  if (
    !Number.isFinite(first) ||
    !Number.isFinite(last) ||
    first === 0
  ) {
    return "stable";
  }

  const change =
    ((last - first) / first) * 100;

  if (change > 3) return "rising";

  if (change < -3) return "falling";

  return "stable";
}

export async function getMarketRecommendation(
  crops = [],
  preferredLanguage = "en"
) {
  const language =
    getLanguageName(preferredLanguage);

  const safeCrops = Array.isArray(crops)
    ? crops
    : [];

  const cropData = safeCrops
    .map((crop) => {
      const history =
        Array.isArray(
          crop?.priceHistory
        )
          ? crop.priceHistory
          : [];

      const trend =
        calculateTrend(history);

      return `
Crop: ${crop?.name || "Unknown"}
Mandi: ${crop?.mandiName || "Unknown"}
Current price: ₹${Number(crop?.currentPrice) || 0}/quintal
Last 4 weeks: ${
        history.join(", ") ||
        "No history"
      }
Calculated trend: ${trend}
`;
    })
    .join("\n");

  const prompt = `
You are KrishiShayak, a farming assistant helping Indian farmers decide when to sell crops.

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

  const rawText =
    await callGemini(prompt);

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
  const language =
    getLanguageName(preferredLanguage);

  const prompt = `
You are KrishiShayak, a farming assistant helping Indian farmers understand a yield prediction.

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