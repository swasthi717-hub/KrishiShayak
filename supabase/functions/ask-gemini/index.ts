import "@supabase/functions-js/edge-runtime.d.ts";

import {
  corsHeaders,
} from "npm:@supabase/supabase-js@^2/cors";

// =============================================================
// CONFIGURATION
// =============================================================

// Primary model
const PRIMARY_MODEL =
  "gemini-3.6-flash";

// Backup model used ONLY when the primary returns HTTP 429
const FALLBACK_MODEL =
  "gemini-3.5-flash-lite";

// Gemini API key must remain server-side
const GEMINI_API_KEY =
  Deno.env.get("GEMINI_API_KEY");

// =============================================================
// EDGE FUNCTION
// =============================================================

Deno.serve(async (req) => {
  // ===========================================================
  // CORS
  // ===========================================================

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // ===========================================================
  // METHOD CHECK
  // ===========================================================

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  }

  // ===========================================================
  // GEMINI API KEY CHECK
  // ===========================================================

  if (!GEMINI_API_KEY) {
    console.error(
      "GEMINI_API_KEY is missing"
    );

    return new Response(
      JSON.stringify({
        error:
          "Gemini API key is not configured",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  }

  try {
    // =========================================================
    // READ REQUEST BODY
    // =========================================================

    const body = await req.json();

    const prompt =
      body?.prompt;

    const language =
      body?.language || "en";

    const context =
      body?.context || {};

    // =========================================================
    // VALIDATE PROMPT
    // =========================================================

    if (
      !prompt ||
      typeof prompt !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Prompt is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    // =========================================================
    // EXTRACT CONTEXT
    // =========================================================

    const location =
      context?.location || {};

    const weather =
      context?.weather || {};

    const mandi =
      context?.mandi || {};

    // =========================================================
    // BUILD FINAL GEMINI PROMPT
    // =========================================================

    const finalPrompt = `
You are KrishiSahayak, a friendly AI farming assistant helping Indian farmers.

Your job is to answer the farmer's question using the REAL application data supplied below.

============================================================
FARMER QUESTION
============================================================

${prompt}

============================================================
PREFERRED LANGUAGE
============================================================

${language}

Respond ONLY in the requested language.

============================================================
FARMER LOCATION
============================================================

${JSON.stringify(
  location,
  null,
  2
)}

============================================================
LIVE WEATHER DATA
============================================================

${JSON.stringify(
  weather,
  null,
  2
)}

============================================================
LIVE MANDI DATA
============================================================

${JSON.stringify(
  mandi,
  null,
  2
)}

============================================================
IMPORTANT DATA RULES
============================================================

1. The weather data supplied above comes from the application's weather API.

2. The mandi data supplied above comes from the application's mandi API.

3. Use the supplied real data whenever it is relevant to the farmer's question.

4. NEVER invent a weather value.

5. NEVER invent a mandi price.

6. NEVER invent a market, district, commodity, variety, grade, or arrival date.

7. NEVER claim that a future market price is known.

8. If mandi data is unavailable or contains no records, clearly tell the farmer that current mandi data is unavailable.

9. If weather data is unavailable, clearly tell the farmer that live weather data is unavailable.

10. If the farmer asks about "today", use the supplied current/live data.

11. If the farmer asks about rainfall or weather, use the supplied weather data.

12. If the farmer asks about mandi prices, selling, market rates, or crop prices, use the supplied mandi records when available.

13. If several mandi records are available, compare the actual records instead of inventing a preferred market.

14. Do not confuse minimum price, maximum price, and modal price.

15. Do not convert or modify supplied mandi prices unless the calculation is necessary and clearly explained.

16. Use the farmer's location when it is relevant to the question.

17. Do not invent pesticide names.

18. Do not invent pesticide dosages.

19. Do not invent chemical application schedules.

20. If chemical treatment is discussed, advise the farmer to follow the product label and consult a local agricultural officer.

21. Do not present an AI disease diagnosis as completely certain.

22. If there is insufficient information, say so instead of making up facts.

23. Do not pretend that information is live if the supplied data is unavailable or outdated.

24. Do not claim predictions are guaranteed.

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

If the question is unrelated to farming, politely explain that KrishiSahayak is primarily designed for farming-related questions.

============================================================
EXAMPLES
============================================================

Question:
"आज बारिश होगी क्या?"

Use the supplied weather data and answer based on the actual forecast.

Question:
"आज प्याज बेचना सही है?"

Use the supplied onion mandi records if available.

Question:
"मेरे खेत में अभी क्या करना चाहिए?"

Use the farmer's location and current/forecast weather when relevant.

Question:
"Which mandi has the best onion price?"

Compare the supplied onion mandi records. Do not invent a market or price.

============================================================
FINAL ANSWER
============================================================
`;

    // =========================================================
    // GEMINI REQUEST HELPER
    // =========================================================

    async function callGemini(
      model: string
    ) {
      console.log(
        `Calling Gemini model: ${model}`
      );

      const response =
        await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-goog-api-key":
                GEMINI_API_KEY,
            },

            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: finalPrompt,
                    },
                  ],
                },
              ],
            }),
          }
        );

      const data =
        await response.json();

      return {
        response,
        data,
      };
    }

    // =========================================================
    // TRY PRIMARY MODEL
    // =========================================================

    let result =
      await callGemini(
        PRIMARY_MODEL
      );

    let modelUsed =
      PRIMARY_MODEL;

    // =========================================================
    // FALLBACK ONLY FOR HTTP 429
    // =========================================================

    if (
      result.response.status === 429
    ) {
      console.warn(
        `Gemini primary model ${PRIMARY_MODEL} returned 429.`
      );

      console.warn(
        `Falling back to ${FALLBACK_MODEL}.`
      );

      result =
        await callGemini(
          FALLBACK_MODEL
        );

      modelUsed =
        FALLBACK_MODEL;
    }

    const {
      response,
      data,
    } = result;

    // =========================================================
    // HANDLE GEMINI ERROR
    // =========================================================

    if (!response.ok) {
      console.error(
        `Gemini API error from ${modelUsed}:`,
        data
      );

      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "Gemini request failed",

          model:
            modelUsed,

          status:
            response.status,
        }),
        {
          status:
            response.status >= 400 &&
            response.status < 500
              ? response.status
              : 500,

          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    // =========================================================
    // EXTRACT GEMINI TEXT
    // =========================================================

    const text =
      data?.candidates?.[0]
        ?.content?.parts
        ?.map(
          (part: {
            text?: string;
          }) =>
            part?.text || ""
        )
        .join("")
        .trim() || "";

    // =========================================================
    // EMPTY RESPONSE CHECK
    // =========================================================

    if (!text) {
      console.error(
        `Gemini returned no text from ${modelUsed}:`,
        data
      );

      return new Response(
        JSON.stringify({
          error:
            "Gemini returned an empty response",

          model:
            modelUsed,
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    // =========================================================
    // SUCCESS
    // =========================================================

    console.log(
      `Gemini response generated successfully using ${modelUsed}`
    );

    return new Response(
      JSON.stringify({
        text,
        model: modelUsed,
      }),
      {
        status: 200,

        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  } catch (error) {
    // =========================================================
    // UNEXPECTED ERROR
    // =========================================================

    console.error(
      "ask-gemini error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      }),
      {
        status: 500,

        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  }
});