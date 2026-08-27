const axios = require("axios");
const env = require("../config/env");
const { ApiError } = require("../utils/errors");

function assertConfigured() {
  if (!env.geminiApiKey) {
    throw new ApiError(503, "AI Copilot is not configured. Set GEMINI_API_KEY to enable it.");
  }
}

async function generateReply({ systemPrompt, history, message }) {
  assertConfigured();

  const contents = [
    ...history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    { role: "user", parts: [{ text: message }] },
  ];

  const url = `${env.geminiApiBaseUrl}/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

  try {
    const { data } = await axios.post(
      url,
      {
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
      },
      { timeout: 15000 }
    );

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    if (!text) {
      throw new ApiError(502, "AI Copilot returned an empty response");
    }
    return text;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, `AI Copilot request failed: ${error.message}`);
  }
}

module.exports = { generateReply };