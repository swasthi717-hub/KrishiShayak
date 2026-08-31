// frontend/src/lib/geminiPrompts.js

const SUPABASE_FUNCTION_URL = "https://her-project-id.supabase.co/functions/v1/ask-gemini";

// Generic helper — every feature below uses this to actually call Gemini
async function callGemini(prompt) {
  const response = await fetch(SUPABASE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

// -------------------------------------------------------------
// 1. DISEASE EXPLANATION
// -------------------------------------------------------------
export async function getDiseaseExplanation(diseaseName) {
  const prompt = `You are a friendly farming assistant helping Indian farmers. 
A farmer's crop has been diagnosed with: ${diseaseName}.

Explain in simple, plain language:
1. What causes this disease
2. Simple treatment steps the farmer can take
3. How to prevent it in the future

If you recommend any specific chemical/fungicide, remind the farmer to confirm exact dosage with a local agricultural officer or the product label before use.

Keep the response short, practical, and easy to understand for someone without technical background.`;

  return callGemini(prompt);
}

// -------------------------------------------------------------
// 2. MULTILINGUAL CHAT ASSISTANT
// -------------------------------------------------------------
export async function getChatResponse(question) {
  const prompt = `You are a friendly farming assistant helping Indian farmers with crop, 
weather, and farming-related questions.

Respond in the SAME language the farmer used in their question below. 
Keep the answer simple, practical, and easy to understand for someone 
without technical background. If the question is not related to farming, 
politely redirect them to ask farming-related questions.

Farmer's question: ${question}`;

  return callGemini(prompt);
}

// -------------------------------------------------------------
// 3. ACTION PLAN (returns JSON — summary + per-crop cards)
// -------------------------------------------------------------
export async function getActionPlan(weatherData, crops, activeAlerts = []) {
  const cropList = crops.map(c => `${c.name} (${c.acres} acres)`).join(", ");
  const alertsText = activeAlerts.length > 0 ? `Active alerts: ${activeAlerts.join(", ")}` : "No active alerts";

  const prompt = `You are a farming assistant helping Indian farmers plan their day.

Today's weather: ${weatherData}
Farmer's crops: ${cropList}
${alertsText}

Respond with ONLY valid JSON in this exact structure, no extra text:

{
  "summary": "one short paragraph (2-3 sentences) combining the most important actions for today, prioritized by urgency, for the home page",
  "cropCards": [
    {
      "crop": "crop name",
      "riskLevel": "High Risk" or "Monitor" or "Action Needed" or "All Good",
      "impacts": [
        { "type": "rain" or "pest" or "price" or "heat", "title": "short title", "description": "one sentence" }
      ],
      "yourAction": "one clear short sentence"
    }
  ]
}

Include one cropCard per crop listed. Give 2-3 impacts per crop based on today's conditions.`;

  const rawText = await callGemini(prompt);
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// -------------------------------------------------------------
// 4. MARKET RECOMMENDATION (returns JSON — sell/wait per crop)
// -------------------------------------------------------------
export async function getMarketRecommendation(crops) {
  const cropData = crops.map(c =>
    `${c.name} at ${c.mandiName}: current price ₹${c.currentPrice}/quintal, last 4 weeks: ${c.priceHistory.join(", ")}`
  ).join("\n");

  const prompt = `You are a farming assistant helping Indian farmers decide when to sell their crops.

Price data:
${cropData}

Respond with ONLY valid JSON in this exact structure, no extra text:

[
  { "crop": "crop name", "recommendation": "Sell Today" or "Wait X-Y Days", "reason": "one short phrase" }
]

Base your recommendation on whether prices are rising, falling, or stable.`;

  const rawText = await callGemini(prompt);
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// -------------------------------------------------------------
// 5. YIELD/PROFIT EXPLANATION (turns the What-If Simulator's numbers into plain language)
// -------------------------------------------------------------
export async function getYieldExplanation(predictedYield, expectedProfit, inputs) {
  const prompt = `You are a farming assistant helping Indian farmers understand a yield prediction.

Based on: Rainfall ${inputs.rainfall}mm, Irrigation ${inputs.irrigation}%, Fertilizer ${inputs.fertilizer}%
Predicted yield: ${predictedYield} quintals
Expected profit: ₹${expectedProfit}

In 2-3 simple sentences, explain what this means for the farmer and one suggestion to improve the outcome if possible.`;

  return callGemini(prompt);
}