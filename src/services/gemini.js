// frontend/src/lib/geminiPrompts.js

const ASK_GEMINI_URL = "https://qsnlrzkvirtiaqageadh.supabase.co/functions/v1/ask-gemini";
async function callGemini(prompt) {
const response = await fetch(ASK_GEMINI_URL, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ prompt })
});
const data = await response.json();
if (!response.ok) throw new Error(data.error || "Gemini request failed");
if (!data.text) throw new Error("Gemini returned an empty response");
return data.text;
}

// -------------------------------------------------------------
// 1. DISEASE EXPLANATION
// -------------------------------------------------------------
export async function getDiseaseExplanation(diseaseName, cropName = "") {
const prompt = `You are a friendly farming assistant helping Indian farmers.
Crop: ${cropName || "Unknown"}
Detected disease: ${diseaseName}
Explain in simple language:
1. What this disease is
2. What commonly causes or encourages it
3. Practical treatment/management steps
4. How to prevent it in the future
Do not invent pesticide names, dosages, or application schedules.
If chemical treatment may be appropriate, tell the farmer to follow the
product label and consult a local agricultural officer.
If the model result may be uncertain, avoid presenting the diagnosis as
medically/agriculturally certain. Keep the answer short and practical.`;
return callGemini(prompt);
}

// -------------------------------------------------------------
// 2. MULTILINGUAL CHAT ASSISTANT
// -------------------------------------------------------------
export async function getChatResponse(question) {
  const prompt = `You are a friendly farming assistant helping Indian farmers with crop,
weather, and farming-related questions.

Respond in the SAME language the farmer used in their question.

Keep the answer simple, practical, and easy to understand for someone
without technical background.

If the question is not related to farming, politely redirect them to
ask farming-related questions.

Farmer's question:
${question}`;

  return callGemini(prompt);
}

// -------------------------------------------------------------
// 3. ACTION PLAN (returns JSON — summary + per-crop cards)
// -------------------------------------------------------------
// Identify risks with simple rules FIRST:
function identifyRisks(weatherData) {
const risks = [];
if (weatherData.rainProbability > 70) risks.push('heavy_rain');
if (weatherData.humidity > 80) risks.push('high_humidity_fungal_risk');
if (weatherData.temperature > 38) risks.push('heat_stress');
return risks;
}
export async function getActionPlan(weatherData, crops, activeAlerts = []) {
const risks = identifyRisks(weatherData); // computed facts, not Gemini's
decision
const cropList = crops.map(c => `${c.name} (${c.acres} acres)`).join(", ");
const prompt = `You are a farming assistant. Use ONLY these already-identified
facts — do not invent additional weather data or risks.
Weather: ${JSON.stringify(weatherData)}
Identified risks: ${risks.join(', ') || 'none'}
Crops: ${cropList}
Alerts: ${activeAlerts.join(', ') || 'none'}
Respond with ONLY valid JSON: { "summary": "2-3 sentence plan",
"cropCards": [{ "crop":"name", "riskLevel":"High Risk|Monitor|Action Needed|All
Good",
"impacts":[{"type":"rain|pest|price|heat","title":"...","description":"..."}],
"yourAction":"..." }] }`;
const rawText = await callGemini(prompt);
return JSON.parse(rawText.replace(/```json|```/g, "").trim());
}
// -------------------------------------------------------------
// 4. MARKET RECOMMENDATION (returns JSON — sell/wait per crop)
// -------------------------------------------------------------
function calculateTrend(priceHistory) {
  const first = priceHistory[0];
  const last = priceHistory[priceHistory.length - 1];
  const change = ((last - first) / first) * 100;
  if (change > 3) return 'rising';
  if (change < -3) return 'falling';
  return 'stable';
}

export async function getMarketRecommendation(crops) {
  const cropData = crops.map(c => {
    const trend = calculateTrend(c.priceHistory);
    return `${c.name} at ${c.mandiName}: ₹${c.currentPrice}/quintal, trend: ${trend} (last 4 weeks: ${c.priceHistory.join(', ')})`;
  }).join("\n");

  const prompt = `You are a farming assistant. Below is REAL, ALREADY-CALCULATED
price trend data — do not invent or predict different numbers.
${cropData}
Respond with ONLY valid JSON: [{ "crop":"name", "recommendation":"Sell Today|Wait X-Y Days",
"reason":"short phrase based only on the trend given above" }]`;

  const rawText = await callGemini(prompt);
  return JSON.parse(rawText.replace(/```json|```/g, "").trim());
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