import { getServiceClient, settlePhonePeOrder, sha256Hex } from "../_shared/phonepe.ts";

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
    if (!merchantOrderId || !["checkout.order.completed", "checkout.order.failed"].includes(event)) {
      return Response.json({ received: true, ignored: true }, { status: 200 });
    }

    const service = getServiceClient();
    const eventId = await sha256Hex(raw);
    const { error: eventError } = await service.from("subscription_webhook_events").insert({
      provider: "phonepe", provider_event_id: eventId, event_type: event,
      signature_valid: true, payload: body, processed_at: new Date().toISOString(),
    });
    if (eventError?.code === "23505") return Response.json({ received: true, duplicate: true }, { status: 200 });
    if (eventError) throw eventError;

    if (event === "checkout.order.completed" && payload.state === "COMPLETED") {
      await settlePhonePeOrder(service, merchantOrderId);
    } else if (event === "checkout.order.failed" && payload.state === "FAILED") {
      const { data: payment } = await service.from("subscription_payments")
        .select("id,user_subscription_id").eq("provider", "phonepe").eq("provider_invoice_id", merchantOrderId).maybeSingle();
      if (payment) {
        await service.from("subscription_payments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", payment.id).neq("status", "captured");
        if (payment.user_subscription_id) await service.from("user_subscriptions").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", payment.user_subscription_id).eq("status", "pending");
      }
    }
    return Response.json({ received: true }, { status: 200 });
  } catch (_error) {
    // Do not leak configuration, credentials, or provider response details to the caller.
    return Response.json({ error: "Webhook could not be processed" }, { status: 500 });
  }
});
