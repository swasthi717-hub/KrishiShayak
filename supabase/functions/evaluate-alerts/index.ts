// supabase/functions/evaluate-alerts/index.ts
//
// This is the piece that was completely missing: nothing in the repo
// evaluated alert_rules, turned a rule breach into a `notifications` row,
// or actually sent the FCM push. This function does all three.
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
//   FCM_SERVER_KEY        — Firebase Cloud Messaging legacy server key
//                            (Firebase Console → Project Settings → Cloud
//                            Messaging → Server key)
//   SUPABASE_URL           — auto-provided by Supabase Edge Functions
//   SUPABASE_SERVICE_ROLE_KEY — auto-provided by Supabase Edge Functions
//
// Trigger this on a schedule (e.g. every 30 min) using Supabase's
// pg_cron + pg_net, or an external scheduler hitting this function's URL.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY")!;

// ------------------------------------------------------------------
// STUBS — replace these once the weather/mandi APIs are available.
// Return shape: { [metric]: numericValue } for the given rule's context.
// Metric names must match what's stored in alert_rules.metric, e.g.
// 'rainfall_mm', 'temperature_c', 'price_per_quintal'.
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

  await Promise.all(
    tokens.map((t) =>
      fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${FCM_SERVER_KEY}`,
        },
        body: JSON.stringify({
          to: t.fcm_token,
          notification: { title, body },
        }),
      }).catch((err) => console.error("FCM send failed for token:", err))
    )
  );
}

Deno.serve(async () => {
  // 1. Load all active alert rules.
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

    // 2. Get the relevant live data for this rule's category.
    const data =
      rule.category === "weather" ? await fetchWeatherData(rule.user_id)
      : rule.category === "market" ? await fetchMandiData(rule.user_id)
      : null; // pest_disease / yield_risk sources can be added the same way later

    if (!data || data[rule.metric] === undefined) continue; // no data source yet — skip silently

    const value = data[rule.metric];
    const isTriggered = evaluateCondition(value, rule.operator, rule.threshold);
    if (!isTriggered) continue;

    // 3. Respect the user's notification preferences.
    const prefKey = preferenceKeyForCategory(rule.category);
    if (prefKey) {
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select(prefKey)
        .eq("user_id", rule.user_id)
        .maybeSingle();

      if (prefs && prefs[prefKey] === false) continue; // user opted out of this category
    }

    // 4. Insert the notification — dedupe_key + UNIQUE(user_id, dedupe_key)
    //    means re-running this function repeatedly (e.g. every 30 min)
    //    won't spam the same alert; it'll just no-op on conflict.
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

    // Only push if this was actually a new row (ignoreDuplicates means a
    // duplicate returns no row back).
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