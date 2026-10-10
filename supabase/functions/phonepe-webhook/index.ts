import { getServiceClient, getPhonePeSubscriptionStatus, settlePhonePeOrder, sha256Hex } from "../_shared/phonepe.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  try {
    const username = Deno.env.get("PHONEPE_WEBHOOK_USERNAME");
    const password = Deno.env.get("PHONEPE_WEBHOOK_PASSWORD");
    if (!username || !password) throw new Error("PhonePe webhook credentials are not configured");
    const expected = await sha256Hex(`${username}:${password}`);
    const received = (req.headers.get("Authorization") || "").replace(/^SHA256\s+/i, "").trim().toLowerCase();
    if (!received || received.length !== expected.length) return Response.json({ error: "Unauthorized" }, { status: 401 });
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ received.charCodeAt(i);
    if (mismatch !== 0) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await req.text();
    const body = JSON.parse(raw);
    const event = String(body?.event || "");
    const payload = body?.payload || {};
    const merchantOrderId = payload?.merchantOrderId;
    const supported = [
      "subscription.setup.order.completed", "subscription.setup.order.failed",
      "subscription.redemption.order.completed", "subscription.redemption.order.failed",
      "subscription.redemption.transaction.completed", "subscription.redemption.transaction.failed",
      "subscription.paused", "subscription.unpaused", "subscription.revoked", "subscription.cancelled",
      "subscription.notification.completed", "subscription.notification.failed",
      "checkout.order.completed", "checkout.order.failed",
    ];
    if (!supported.includes(event)) return Response.json({ received: true, ignored: true }, { status: 200 });

    const service = getServiceClient();
    const eventId = await sha256Hex(raw);
    const { error: eventError } = await service.from("subscription_webhook_events").insert({
      provider: "phonepe", provider_event_id: eventId, event_type: event, signature_valid: true, payload: body,
    });
    if (eventError?.code === "23505") {
      const { data: priorEvent, error: priorError } = await service.from("subscription_webhook_events")
        .select("processed_at").eq("provider", "phonepe").eq("provider_event_id", eventId).maybeSingle();
      if (priorError) throw priorError;
      if (priorEvent?.processed_at) return Response.json({ received: true, duplicate: true }, { status: 200 });
    } else if (eventError) throw eventError;

    const isOrderEvent = event.includes(".order.") || event.includes(".transaction.") || event.startsWith("checkout.order.");
    if (isOrderEvent && merchantOrderId && (event.endsWith(".completed") || event.endsWith(".failed"))) {
      if (event.endsWith(".completed")) await settlePhonePeOrder(service, merchantOrderId);
      else {
        const { data: payment, error } = await service.from("subscription_payments")
          .select("id,user_subscription_id,payment_purpose").eq("provider", "phonepe").eq("provider_invoice_id", merchantOrderId).maybeSingle();
        if (error) throw error;
        if (payment) {
          await service.from("subscription_payments").update({
            status: "failed", failure_description: "PhonePe reported a failed payment", updated_at: new Date().toISOString(),
          }).eq("id", payment.id).neq("status", "captured");
          if (payment.payment_purpose === "initial" && payment.user_subscription_id) {
            await service.from("user_subscriptions").update({ status: "expired", updated_at: new Date().toISOString() })
              .eq("id", payment.user_subscription_id).eq("status", "pending");
          } else if (payment.payment_purpose === "renewal" && payment.user_subscription_id) {
            await service.from("user_subscriptions").update({ failed_payment_count: 1, updated_at: new Date().toISOString() })
              .eq("id", payment.user_subscription_id).eq("status", "active");
          }
        }
      }
    } else {
      const merchantSubscriptionId = payload?.merchantSubscriptionId || payload?.paymentFlow?.merchantSubscriptionId;
      if (merchantSubscriptionId) {
        const { data: subscription, error } = await service.from("user_subscriptions")
          .select("id,status,current_period_end").eq("phonepe_merchant_subscription_id", merchantSubscriptionId).maybeSingle();
        if (error) throw error;
        if (subscription) {
          const now = new Date();
          let status = subscription.status;
          if (event === "subscription.paused") status = "halted";
          else if (event === "subscription.unpaused") status = "active";
          else if (event === "subscription.revoked" || event === "subscription.cancelled") {
            status = subscription.current_period_end && new Date(subscription.current_period_end) > now ? "cancel_at_period_end" : "cancelled";
          }
          await service.from("user_subscriptions").update({
            status, cancel_at_period_end: ["subscription.revoked", "subscription.cancelled"].includes(event) || status === "cancel_at_period_end",
            cancelled_at: ["subscription.revoked", "subscription.cancelled"].includes(event) ? now.toISOString() : undefined,
            updated_at: now.toISOString(),
          }).eq("id", subscription.id);
        }
      }
    }

    await service.from("subscription_webhook_events").update({ processed_at: new Date().toISOString(), processing_error: null })
      .eq("provider", "phonepe").eq("provider_event_id", eventId);
    return Response.json({ received: true }, { status: 200 });
  } catch (_error) {
    return Response.json({ error: "Webhook could not be processed" }, { status: 500 });
  }
});
