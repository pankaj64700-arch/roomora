import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getServiceClient, settlePhonePeOrder } from "../_shared/phonepe.ts";

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Sign in to verify payment" }, { status: 401, headers });
    const url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anonKey) throw new Error("Supabase auth is not configured");
    const authClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401, headers });
    const body = await req.json();
    const merchantOrderId = body?.merchantOrderId;
    if (typeof merchantOrderId !== "string" || !/^RM_[a-f0-9]{32}$/.test(merchantOrderId)) {
      return Response.json({ error: "Invalid payment order" }, { status: 400, headers });
    }
    const result = await settlePhonePeOrder(getServiceClient(), merchantOrderId, user.id);
    if (result.state === "completed") {
      return Response.json({
        state: result.state,
        tokensGranted: result.tokensGranted,
        message: `Payment successful! Your subscription includes ${result.tokensGranted} tokens. If this is the launch offer, that is 50 subscription tokens + 5 bonus tokens. 🎉`,
      }, { headers });
    }
    if (result.state === "pending") return Response.json({ state: "pending", message: "PhonePe is still confirming your payment. Please check again shortly." }, { headers });
    return Response.json({ state: "failed", message: "Payment was not completed. No tokens have been added." }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to verify payment" }, { status: 400, headers });
  }
});
