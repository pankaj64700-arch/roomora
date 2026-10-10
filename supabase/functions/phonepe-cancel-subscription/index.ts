import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getPhonePeSubscriptionStatus, getServiceClient, phonePeRequest } from "../_shared/phonepe.ts";

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Sign in to manage your subscription" }, { status: 401, headers });
    const url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anonKey) throw new Error("Supabase auth is not configured");
    const authClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return Response.json({ error: "Your session has expired. Sign in again." }, { status: 401, headers });

    const service = getServiceClient();
    const { data: subscription, error } = await service.from("user_subscriptions")
      .select("id,phonepe_merchant_subscription_id,current_period_end,status,billing_provider")
      .eq("user_id", user.id).eq("billing_provider", "phonepe")
      .in("status", ["active", "cancel_at_period_end", "halted"])
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (!subscription?.phonepe_merchant_subscription_id) return Response.json({ error: "No active PhonePe AutoPay subscription was found." }, { status: 404, headers });

    const providerStatus = await getPhonePeSubscriptionStatus(subscription.phonepe_merchant_subscription_id);
    if (["ACTIVE", "PAUSED", "PAUSE_IN_PROGRESS", "UNPAUSE_IN_PROGRESS"].includes(providerStatus.state)) {
      await phonePeRequest(`/checkout/v2/subscriptions/${encodeURIComponent(subscription.phonepe_merchant_subscription_id)}/cancel`, { method: "POST", body: "{}" });
    } else if (!["CANCELLED", "CANCEL_IN_PROGRESS", "REVOKED", "EXPIRED"].includes(providerStatus.state)) {
      return Response.json({ error: "PhonePe has not confirmed a cancellable mandate state." }, { status: 409, headers });
    }
    const now = new Date().toISOString();
    const hasRemainingPeriod = subscription.current_period_end && new Date(subscription.current_period_end) > new Date();
    const { error: updateError } = await service.from("user_subscriptions").update({
      status: hasRemainingPeriod ? "cancel_at_period_end" : "cancelled",
      cancel_at_period_end: true, cancelled_at: now, updated_at: now,
    }).eq("id", subscription.id).eq("user_id", user.id);
    if (updateError) throw updateError;
    return Response.json({
      state: hasRemainingPeriod ? "cancel_at_period_end" : "cancelled",
      message: hasRemainingPeriod ? "AutoPay has been cancelled. Your current paid access remains until the period ends." : "Your AutoPay subscription is cancelled.",
    }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not cancel subscription" }, { status: 400, headers });
  }
});
