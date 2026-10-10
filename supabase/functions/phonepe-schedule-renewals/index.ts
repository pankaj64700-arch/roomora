import { getPhonePeSubscriptionStatus, getServiceClient, phonePeRequest } from "../_shared/phonepe.ts";

function constantTimeEquals(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  const secret = Deno.env.get("ROOMORA_SCHEDULER_SECRET");
  const supplied = req.headers.get("x-roomora-scheduler-secret") || "";
  if (!secret || !constantTimeEquals(secret, supplied)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const service = getServiceClient();
  const now = new Date();
  const lower = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upper = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const { data: subscriptions, error } = await service.from("user_subscriptions")
    .select("id,user_id,plan_id,current_period_end,phonepe_merchant_subscription_id,status,cancel_at_period_end")
    .eq("status", "active").eq("billing_provider", "phonepe").eq("cancel_at_period_end", false)
    .not("phonepe_merchant_subscription_id", "is", null)
    .gte("current_period_end", lower.toISOString()).lte("current_period_end", upper.toISOString())
    .limit(100);
  if (error) return Response.json({ error: "Could not load subscriptions due for renewal" }, { status: 500 });

  const results: Array<{ subscriptionId: string; state: string }> = [];
  for (const sub of subscriptions || []) {
    try {
      const periodStart = new Date(sub.current_period_end);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      const { data: plan, error: planError } = await service.from("subscription_plans")
        .select("monthly_price,active").eq("id", sub.plan_id).maybeSingle();
      if (planError || !plan?.active) {
        results.push({ subscriptionId: sub.id, state: "plan_unavailable" });
        continue;
      }
      const amount = Math.round(Number(plan.monthly_price) * 100);
      if (!Number.isSafeInteger(amount) || amount < 100) {
        results.push({ subscriptionId: sub.id, state: "invalid_amount" });
        continue;
      }
      const { data: existing, error: existingError } = await service.from("subscription_payments")
        .select("id,status").eq("user_subscription_id", sub.id).eq("payment_purpose", "renewal")
        .eq("billing_period_start", periodStart.toISOString()).maybeSingle();
      if (existingError) throw existingError;
      if (existing) {
        results.push({ subscriptionId: sub.id, state: `already_scheduled:${existing.status}` });
        continue;
      }

      const providerState = await getPhonePeSubscriptionStatus(sub.phonepe_merchant_subscription_id);
      if (providerState.state !== "ACTIVE") {
        const nextStatus = ["CANCELLED", "REVOKED", "EXPIRED", "FAILED"].includes(providerState.state) ? "cancelled" : "halted";
        await service.from("user_subscriptions").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", sub.id);
        results.push({ subscriptionId: sub.id, state: `provider_${String(providerState.state || "unknown").toLowerCase()}` });
        continue;
      }

      const merchantOrderId = `RM_${crypto.randomUUID().replaceAll("-", "")}`;
      const { error: insertError } = await service.from("subscription_payments").insert({
        user_id: sub.user_id, user_subscription_id: sub.id, provider: "phonepe",
        provider_invoice_id: merchantOrderId, provider_subscription_id: sub.phonepe_merchant_subscription_id,
        amount_minor: amount, currency: "INR", status: "created", payment_purpose: "renewal",
        billing_period_start: periodStart.toISOString(), billing_period_end: periodEnd.toISOString(),
      });
      if (insertError) {
        if (insertError.code === "23505") {
          results.push({ subscriptionId: sub.id, state: "already_scheduled" });
          continue;
        }
        throw insertError;
      }

      try {
        const { data: notify } = await phonePeRequest("/checkout/v2/subscriptions/notify", {
          method: "POST",
          body: JSON.stringify({
            merchantOrderId,
            amount,
            paymentFlow: {
              type: "SUBSCRIPTION_CHECKOUT_REDEMPTION",
              merchantSubscriptionId: sub.phonepe_merchant_subscription_id,
              redemptionRetryStrategy: "STANDARD",
              autoDebit: true,
            },
          }),
        });
        await service.from("subscription_payments").update({
          status: "authorized", provider_payment_id: notify.orderId || null, updated_at: new Date().toISOString(),
        }).eq("provider_invoice_id", merchantOrderId);
        await service.from("user_subscriptions").update({
          next_renewal_notification_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).eq("id", sub.id);
        results.push({ subscriptionId: sub.id, state: "renewal_notified" });
      } catch (_notifyError) {
        await service.from("subscription_payments").update({
          status: "failed", failure_description: "PhonePe renewal notification request failed; reconcile before retrying",
          updated_at: new Date().toISOString(),
        }).eq("provider_invoice_id", merchantOrderId);
        results.push({ subscriptionId: sub.id, state: "notification_failed_manual_reconciliation_required" });
      }
    } catch (_subError) {
      results.push({ subscriptionId: sub.id, state: "error_manual_reconciliation_required" });
    }
  }
  return Response.json({ processed: results.length, results }, { status: 200 });
});
