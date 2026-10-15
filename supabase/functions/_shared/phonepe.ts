import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = (Deno.env.get("ROOMORA_ALLOWED_ORIGINS") || Deno.env.get("ROOMORA_SITE_URL") || "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const localDev = /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
  return { ...jsonHeaders, "Access-Control-Allow-Origin": allowed.includes(origin) || localDev ? origin : (allowed[0] || "null"), "Vary": "Origin" };
}

export function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase server secrets are not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function getPhonePeConfig() {
  const clientId = Deno.env.get("PHONEPE_CLIENT_ID");
  const clientSecret = Deno.env.get("PHONEPE_CLIENT_SECRET");
  const clientVersion = Deno.env.get("PHONEPE_CLIENT_VERSION");
  if (!clientId || !clientSecret || !clientVersion) throw new Error("PhonePe merchant credentials are not configured");
  const production = Deno.env.get("PHONEPE_ENV") === "production";
  return {
    clientId, clientSecret, clientVersion, production,
    apiBase: production ? "https://api.phonepe.com/apis/pg" : "https://api-preprod.phonepe.com/apis/pg-sandbox",
    authUrl: production ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token" : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
  };
}

export function addCalendarMonth(date: Date) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + 1);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export async function getPhonePeAccessToken() {
  const config = getPhonePeConfig();
  const body = new URLSearchParams({ client_id: config.clientId, client_version: config.clientVersion, client_secret: config.clientSecret, grant_type: "client_credentials" });
  const response = await fetch(config.authUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error("PhonePe authentication failed. Check server-side merchant credentials and environment.");
  return { token: data.access_token as string, config };
}

export async function phonePeRequest(path: string, init: RequestInit = {}) {
  const { token, config } = await getPhonePeAccessToken();
  const response = await fetch(`${config.apiBase}${path}`, {
    ...init,
    headers: { Authorization: `O-Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`PhonePe request failed (HTTP ${response.status})`);
  return { data, config };
}

export async function getPhonePeSubscriptionStatus(merchantSubscriptionId: string) {
  const { data } = await phonePeRequest(`/checkout/v2/subscriptions/${encodeURIComponent(merchantSubscriptionId)}/status`, { method: "GET" });
  return data;
}

export async function settlePhonePeOrder(service: ReturnType<typeof getServiceClient>, merchantOrderId: string, expectedUserId?: string) {
  const { data: payment, error: paymentError } = await service.from("subscription_payments")
    .select("id,user_id,user_subscription_id,amount_minor,status,provider_invoice_id,payment_purpose,billing_period_start,billing_period_end,provider_subscription_id")
    .eq("provider", "phonepe").eq("provider_invoice_id", merchantOrderId).maybeSingle();
  if (paymentError) throw paymentError;
  if (!payment) throw new Error("Payment order was not found");
  if (expectedUserId && payment.user_id !== expectedUserId) throw new Error("Payment order does not belong to this user");

  const { data: existingGrant, error: existingGrantError } = await service.from("subscription_token_grants")
    .select("tokens_granted").eq("provider_invoice_id", merchantOrderId).maybeSingle();
  if (existingGrantError) throw existingGrantError;
  if (payment.status === "captured" && existingGrant) {
    return { state: "completed", tokensGranted: Number(existingGrant.tokens_granted || 0), alreadyGranted: true };
  }

  const { token, config } = await getPhonePeAccessToken();
  const statusResponse = await fetch(`${config.apiBase}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`, {
    headers: { Authorization: `O-Bearer ${token}`, "Content-Type": "application/json" },
  });
  const statusData = await statusResponse.json().catch(() => ({}));
  if (!statusResponse.ok) throw new Error("PhonePe could not verify this payment yet");
  if (Number(statusData.amount) !== Number(payment.amount_minor)) throw new Error("PhonePe amount does not match the RoomOra order");
  if (statusData.state === "PENDING") return { state: "pending", tokensGranted: 0 };
  if (statusData.state === "FAILED") {
    await service.from("subscription_payments").update({ status: "failed", failure_code: statusData.errorCode || null, failure_description: statusData.detailedErrorCode || null, updated_at: new Date().toISOString() }).eq("id", payment.id).neq("status", "captured");
    if (payment.payment_purpose === "initial" && payment.user_subscription_id) {
      await service.from("user_subscriptions").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", payment.user_subscription_id).eq("status", "pending");
    } else if (payment.payment_purpose === "renewal" && payment.user_subscription_id) {
      await service.from("user_subscriptions").update({ failed_payment_count: 1, updated_at: new Date().toISOString() }).eq("id", payment.user_subscription_id).eq("status", "active");
    }
    return { state: "failed", tokensGranted: 0 };
  }
  if (statusData.state !== "COMPLETED") throw new Error("PhonePe returned an unknown payment state");
  if (!payment.user_subscription_id) throw new Error("Payment order has no linked subscription");

  const now = new Date();
  const periodStart = payment.payment_purpose === "renewal" && payment.billing_period_start ? new Date(payment.billing_period_start) : now;
  const periodEnd = payment.payment_purpose === "renewal" && payment.billing_period_end ? new Date(payment.billing_period_end) : addCalendarMonth(periodStart);
  const nowIso = now.toISOString();

  if (payment.payment_purpose === "initial") {
    const merchantSubscriptionId = statusData.paymentFlow?.merchantSubscriptionId || payment.provider_subscription_id;
    if (!merchantSubscriptionId) throw new Error("PhonePe setup response did not contain the merchant subscription ID");
    const providerStatus = await getPhonePeSubscriptionStatus(merchantSubscriptionId);
    if (providerStatus.state !== "ACTIVE") return { state: "pending", tokensGranted: 0 };
    const { error: subError } = await service.from("user_subscriptions").update({
      status: "active", billing_provider: "phonepe", phonepe_merchant_subscription_id: merchantSubscriptionId,
      phonepe_subscription_id: providerStatus.subscriptionId || null,
      started_at: nowIso, current_period_start: periodStart.toISOString(), current_period_end: periodEnd.toISOString(),
      last_payment_at: nowIso, failed_payment_count: 0, updated_at: nowIso,
    }).eq("id", payment.user_subscription_id).eq("user_id", payment.user_id);
    if (subError) throw subError;
  } else {
    const { error: subError } = await service.from("user_subscriptions").update({
      current_period_start: periodStart.toISOString(), current_period_end: periodEnd.toISOString(),
      last_payment_at: nowIso, failed_payment_count: 0, next_renewal_notification_at: null, updated_at: nowIso,
    }).eq("id", payment.user_subscription_id).eq("user_id", payment.user_id).in("status", ["active", "cancel_at_period_end"]);
    if (subError) throw subError;
  }

  const transaction = (statusData.paymentDetails || []).find((item: { state?: string }) => item.state === "COMPLETED");
  const { error: payError } = await service.from("subscription_payments").update({
    status: "captured", provider_payment_id: transaction?.transactionId || statusData.orderId || merchantOrderId,
    paid_at: nowIso, updated_at: nowIso,
  }).eq("id", payment.id);
  if (payError) throw payError;

  const { data: granted, error: grantError } = await service.rpc("grant_subscription_period_tokens", {
    p_user_subscription_id: payment.user_subscription_id, p_period_start: periodStart.toISOString(),
    p_period_end: periodEnd.toISOString(), p_provider_invoice_id: merchantOrderId,
  });
  if (grantError) throw grantError;
  const { data: grant, error: grantReadError } = await service.from("subscription_token_grants")
    .select("tokens_granted").eq("provider_invoice_id", merchantOrderId).maybeSingle();
  if (grantReadError) throw grantReadError;
  return { state: "completed", tokensGranted: Number(grant?.tokens_granted || 0), alreadyGranted: granted === false };
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
