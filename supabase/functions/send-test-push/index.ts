// supabase/functions/send-test-push/index.ts
//
// TEST-ONLY function. Lets you verify the entire FCM pipeline
// (permission -> token -> device_tokens row -> push delivery) works
// end-to-end RIGHT NOW, without needing alert_rules or weather/mandi
// data at all. Once evaluate-alerts is doing real work, you can either
// keep this around for manual testing or delete it.
//
// Deploy:
//   npx supabase functions deploy send-test-push
//
// Call it (from anywhere, e.g. curl, Postman, or a temporary button in
// your app) with a JSON body: { "user_id": "<some auth.users id>" }
//
//   curl -X POST \
//     https://<project-ref>.supabase.co/functions/v1/send-test-push \
//     -H "Authorization: Bearer <anon-or-service-key>" \
//     -H "Content-Type: application/json" \
//     -d '{"user_id":"<uuid>"}'
//
// If it works, that user's device should receive a real push within a
// few seconds — proving requestAndSaveFCMToken() -> device_tokens ->
// FCM delivery is fully wired and correct.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY")!;

Deno.serve(async (req) => {
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), { status: 400 });
    }

    const { data: tokens, error } = await supabase
      .from("device_tokens")
      .select("fcm_token, platform")
      .eq("user_id", user_id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No device_tokens found for this user — the frontend hasn't successfully registered a token yet. Check requestAndSaveFCMToken() ran and check Supabase logs for insert errors."
        }),
        { status: 404 }
      );
    }

    const results = await Promise.all(
      tokens.map(async (t) => {
        const res = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${FCM_SERVER_KEY}`,
          },
          body: JSON.stringify({
            to: t.fcm_token,
            notification: {
              title: "KrishiSahayak Test Alert",
              body: "If you see this, your FCM pipeline is fully working.",
            },
          }),
        });
        const json = await res.json();
        return { platform: t.platform, fcmResponse: json };
      })
    );

    // Also drop a real row into notifications so you can confirm it
    // shows up in the (now-fixed) SmartAlertsPage.
    await supabase.from("notifications").upsert(
      {
        user_id,
        category: "system",
        title: "KrishiSahayak Test Alert",
        body: "This is a manual test alert to verify the FCM pipeline.",
        severity: "info",
        dedupe_key: `manual-test:${Date.now()}`,
      },
      { onConflict: "user_id,dedupe_key", ignoreDuplicates: true }
    );

    return new Response(JSON.stringify({ sentTo: tokens.length, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});