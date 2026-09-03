// supabase/functions/evaluate-alerts/index.ts
//
// Evaluates alert_rules against weather/mandi data, inserts deduped
// notifications, and sends the push via FCM's modern HTTP v1 API
// (OAuth2 service-account auth) instead of the deprecated legacy
// server-key API.
//
// IMPORTANT: fetchWeatherData() and fetchMandiData() below are stubs —
// your weather/mandi APIs haven't been found/wired yet, so they return
// null. Everything downstream (rule evaluation, preferences check, dedup,
// notification insert, FCM send) is fully built and correct already.
//
// Once you have the real weather/mandi API:
//   1. Implement fetchWeatherData() and fetchMandiData() to call the real
//      API and return { [metric]: value } for a given user/location.
//   2. Nothing else in this file needs to change.
//
// Deploy with:
//   npx supabase functions deploy evaluate-alerts
//
// Required secrets (set via `npx supabase secrets set KEY=value`):
//   FIREBASE_PROJECT_ID    — from your Firebase service account JSON ("project_id")
//   FIREBASE_CLIENT_EMAIL  — from the same JSON ("client_email")
//   FIREBASE_PRIVATE_KEY   — from the same JSON ("private_key") — paste the
//                            FULL value including -----BEGIN/END PRIVATE KEY-----.
//                            If your shell mangles the newlines, it's fine to
//                            store it with literal "\n" sequences — this code
//                            converts them back to real newlines below.
//   SUPABASE_URL              — auto-provided by Supabase Edge Functions
//   SUPABASE_SERVICE_ROLE_KEY — auto-provided by Supabase Edge Functions
//
// Get the service account JSON from:
//   Firebase Console → Project Settings → Service Accounts →
//   "Generate new private key"
//
// Trigger this on a schedule (e.g. every 30 min) using Supabase's
// pg_cron + pg_net, or an external scheduler hitting this function's URL.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID")!;
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
const FIREBASE_PRIVATE_KEY = Deno.env.get("FIREBASE_PRIVATE_KEY")!.replace(/\\n/g, "\n");

// ------------------------------------------------------------------
// OAuth2 service-account auth for FCM HTTP v1.
// Builds + signs a JWT, exchanges it for a short-lived access token.
// Cached in-memory for the life of the function instance so we don't
// re-authenticate on every single push send within one invocation.
// ------------------------------------------------------------------
let cachedToken: { value: string; expiresAt: number } | null = null;

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: FIREBASE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const key = await importPrivateKey(FIREBASE_PRIVATE_KEY);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get FCM access token: ${await res.text()}`);
  }

  const json = await res.json();
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
}

// ------------------------------------------------------------------
// STUBS — replace these once the weather/mandi APIs are available.
// ------------------------------------------------------------------
async function fetchWeatherData(_userId: string): Promise<Record<string, number> | null> {
  // TODO: call the real weather API once available, e.g.
  // const res = await fetch(`https://api.weatherprovider.com/...`);
  // const json = await res.json();
  // return { rainfall_mm: json.rainfall, temperature_c: json.temp };
  return null;
}

async function fetchMandiData(_userId: string): Promise<Record<string, number> | null> {
  // TODO: call the real mandi/market-price API once available, e.g.
  // const res = await fetch(`https://api.mandiprovider.com/...`);
  // const json = await res.json();
  // return { price_per_quintal: json.price };
  return null;
}

function evaluateCondition(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case ">": return value > threshold;
    case "<": return value < threshold;
    case ">=": return value >= threshold;
    case "<=": return value <= threshold;
    case "=": return value === threshold;
    default: return false;
  }
}

function preferenceKeyForCategory(category: string): string {
  return {
    weather: "weather_alerts",
    pest_disease: "pest_disease_alerts",
    market: "market_price_updates",
    yield_risk: "yield_risk_alerts",
  }[category] ?? "";
}

async function sendPushToUser(userId: string, title: string, body: string) {
  const { data: tokens, error } = await supabase
    .from("device_tokens")
    .select("fcm_token")
    .eq("user_id", userId);

  if (error || !tokens || tokens.length === 0) return;

  const accessToken = await getAccessToken();

  await Promise.all(
    tokens.map((t : any) =>
      fetch(
        `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token: t.fcm_token,
              notification: { title, body },
            },
          }),
        }
      ).catch((err) => console.error("FCM send failed for token:", err))
    )
  );
}

Deno.serve(async () => {
  const { data: rules, error: rulesError } = await supabase
    .from("alert_rules")
    .select("*")
    .eq("is_active", true);

  if (rulesError) {
    return new Response(JSON.stringify({ error: rulesError.message }), { status: 500 });
  }

  let evaluated = 0;
  let triggered = 0;

  for (const rule of rules ?? []) {
    evaluated++;

    const data =
      rule.category === "weather" ? await fetchWeatherData(rule.user_id)
      : rule.category === "market" ? await fetchMandiData(rule.user_id)
      : null;

    if (!data || data[rule.metric] === undefined) continue;

    const value = data[rule.metric];
    const isTriggered = evaluateCondition(value, rule.operator, rule.threshold);
    if (!isTriggered) continue;

    const prefKey = preferenceKeyForCategory(rule.category);
    if (prefKey) {
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select(prefKey)
        .eq("user_id", rule.user_id)
        .maybeSingle();

      if (prefs && prefs[prefKey] === false) continue;
    }

    const dedupeKey = `${rule.id}:${rule.metric}:${new Date().toISOString().slice(0, 10)}`;
    const title = `${rule.category === "weather" ? "Weather" : "Market"} Alert`;
    const body = `${rule.metric.replace(/_/g, " ")} is ${value} (rule: ${rule.operator} ${rule.threshold})${rule.crop_name ? ` for ${rule.crop_name}` : ""}.`;

    const { error: insertError, data: inserted } = await supabase
      .from("notifications")
      .upsert(
        {
          user_id: rule.user_id,
          category: rule.category,
          title,
          body,
          severity: "warn",
          dedupe_key: dedupeKey,
          sent_at: new Date().toISOString(),
        },
        { onConflict: "user_id,dedupe_key", ignoreDuplicates: true }
      )
      .select();

    if (insertError) {
      console.error("Failed to insert notification:", insertError);
      continue;
    }

    if (inserted && inserted.length > 0) {
      triggered++;
      await sendPushToUser(rule.user_id, title, body);
    }
  }

  return new Response(
    JSON.stringify({ evaluated, triggered }),
    { headers: { "Content-Type": "application/json" } }
  );
});