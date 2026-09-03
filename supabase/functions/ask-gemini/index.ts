import "@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@^2/cors";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const GEMINI_MODEL = "gemini-3.6-flash";

Deno.serve(async (req) => {
  // -----------------------------------------------------------
  // CORS
  // -----------------------------------------------------------

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // -----------------------------------------------------------
  // METHOD
  // -----------------------------------------------------------

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // -----------------------------------------------------------
  // API KEY
  // -----------------------------------------------------------

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing");

    return new Response(
      JSON.stringify({
        error: "Gemini API key is not configured",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    // ---------------------------------------------------------
    // REQUEST BODY
    // ---------------------------------------------------------

    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({
          error: "Prompt is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ---------------------------------------------------------
    // GEMINI REQUEST
    // ---------------------------------------------------------

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // ---------------------------------------------------------
    // GEMINI ERROR
    // ---------------------------------------------------------

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "Gemini request failed",
        }),
        {
          status: response.status >= 400 && response.status < 500
            ? response.status
            : 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ---------------------------------------------------------
    // EXTRACT TEXT
    // ---------------------------------------------------------

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part?.text || "")
        .join("")
        .trim() || "";

    if (!text) {
      console.error("Gemini returned no text:", data);

      return new Response(
        JSON.stringify({
          error: "Gemini returned an empty response",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ---------------------------------------------------------
    // SUCCESS
    // ---------------------------------------------------------

    return new Response(
      JSON.stringify({
        text,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("ask-gemini error:", error);

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
          "Content-Type": "application/json",
        },
      }
    );
  }
});