import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { addCalendarMonth, corsHeaders, getPhonePeAccessToken, getServiceClient } from "../_shared/phonepe.ts";

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Sign in to continue" }, { status: 401, headers });
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) throw new Error("Supabase auth is not configured");
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401, headers });

    const { planId } = await req.json();
    if (typeof planId !== "string" || !planId) return Response.json({ error: "Choose a valid subscription plan" }, { status: 400, headers });

    const service = getServiceClient();
    const { data: plan, error: planError } = await service.from("subscription_plans")
      .select("id,name,monthly_price,token_allowance,monthly_bonus_tokens,active")
      .eq("id", planId).eq("active", true).maybeSingle();
    if (planError) throw planError;
    if (!plan) return Response.json({ error: "This plan is no longer available" }, { status: 404, headers });

    const amountMinor = Math.round(Number(plan.monthly_price) * 100);
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 100) {
      return Response.json({ error: "This plan does not require a payment" }, { status: 400, headers });
    }
    const { data: existing, error: existingError } = await service.from("user_subscriptions")
      .select("id,status,current_period_end,created_at")
      .eq("user_id", user.id).in("status", ["active", "cancel_at_period_end", "pending"])
      .gt("current_period_end", new Date().toISOString()).limit(1).maybeSingle();
    if (existingError) throw existingError;
    if (existing?.status === "pending" && new Date(existing.created_at).getTime() < Date.now() - 20 * 60 * 1000) {
      await service.from("user_subscriptions").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", existing.id).eq("status", "pending");
    } else if (existing) {
      return Response.json({ error: existing.status === "pending"
        ? "You already have a subscription checkout in progress. Finish it or wait 20 minutes before trying again."
        : "You already have an active subscription. Manage it before choosing another plan." }, { status: 409, headers });
    }

    const siteUrl = Deno.env.get("ROOMORA_SITE_URL");
    if (!siteUrl) throw new Error("ROOMORA_SITE_URL is not configured");
    const now = new Date();
    const periodEnd = addCalendarMonth(now);
    const merchantSubscriptionId = `RMS_${crypto.randomUUID().replaceAll("-", "")}`;
    const { data: subscription, error: subError } = await service.from("user_subscriptions").insert({
      user_id: user.id, plan_id: plan.id, status: "pending", billing_provider: "phonepe",
      phonepe_merchant_subscription_id: merchantSubscriptionId,
      started_at: now.toISOString(), current_period_start: now.toISOString(), current_period_end: periodEnd.toISOString(),
    }).select("id").single();
    if (subError) throw subError;

    const merchantOrderId = `RM_${crypto.randomUUID().replaceAll("-", "")}`;
    const { error: paymentError } = await service.from("subscription_payments").insert({
      user_id: user.id, user_subscription_id: subscription.id, provider: "phonepe",
      provider_invoice_id: merchantOrderId, provider_subscription_id: merchantSubscriptionId,
      amount_minor: amountMinor, currency: "INR", status: "created", payment_purpose: "initial",
      billing_period_start: now.toISOString(), billing_period_end: periodEnd.toISOString(),
    });
    if (paymentError) {
      await service.from("user_subscriptions").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", subscription.id);
      throw paymentError;
    }

    try {
      const { token, config } = await getPhonePeAccessToken();
      const redirectUrl = new URL("/", siteUrl);
      redirectUrl.searchParams.set("view", "subscriptions");
      redirectUrl.searchParams.set("phonepe_order", merchantOrderId);
      const phonePeResponse = await fetch(`${config.apiBase}/checkout/v2/pay`, {
        method: "POST",
        headers: { Authorization: `O-Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantOrderId,
          amount: amountMinor,
          expireAfter: 1200,
          paymentFlow: {
            type: "SUBSCRIPTION_CHECKOUT_SETUP",
            merchantUrls: { redirectUrl: redirectUrl.toString() },
            subscriptionDetails: {
              subscriptionType: "RECURRING",
              merchantSubscriptionId,
              authWorkflowType: "TRANSACTION",
              amountType: "FIXED",
              maxAmount: amountMinor,
              frequency: "MONTHLY",
              productType: "UPI_MANDATE",
              expireAt: Date.now() + (10 * 365 * 24 * 60 * 60 * 1000),
            },
          },
          metaInfo: { udf1: user.id, udf2: plan.id, udf3: "roomora_subscription" },
        }),
      });
      const result = await phonePeResponse.json().catch(() => ({}));
      if (!phonePeResponse.ok || !result.redirectUrl) {
        throw new Error("PhonePe could not create the checkout session. Verify your PhonePe merchant credentials and enable Standard Checkout.");
      }
      await service.from("subscription_payments").update({ provider_payment_id: result.orderId || null, updated_at: new Date().toISOString() }).eq("provider_invoice_id", merchantOrderId);
      return Response.json({ redirectUrl: result.redirectUrl, merchantOrderId, merchantSubscriptionId, amount: amountMinor, tokens: Number(plan.token_allowance || 0) + Number(plan.monthly_bonus_tokens || 0) }, { headers });
    } catch (error) {
      await service.from("subscription_payments").update({ status: "failed", failure_description: "PhonePe checkout creation failed", updated_at: new Date().toISOString() }).eq("provider_invoice_id", merchantOrderId);
      await service.from("user_subscriptions").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", subscription.id);
      throw error;
    }
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to start PhonePe checkout" }, { status: 400, headers });
  }
});
