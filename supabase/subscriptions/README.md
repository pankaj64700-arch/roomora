# RoomOra subscription billing — Stage 1

This is a **draft schema foundation** for monthly subscriptions. It is intentionally additive and does not activate payments or change the existing publish flow. The selected payment provider is **PhonePe Payment Gateway**.

## Provider and cost assumptions

- PhonePe advertises a limited-period zero-payment-gateway-fee offer, but RoomOra must confirm merchant eligibility, offer duration, exclusions, and the fees that apply to recurring payments directly in its PhonePe merchant account.
- PhonePe documents UPI AutoPay/recurring payments, but AutoPay access and merchant eligibility must be confirmed before production use.
- Do not promise a free gateway indefinitely or assume the promotional rate covers every recurring payment method.
- Keep the RoomOra free plan available. Paid checkout stays disabled until PhonePe merchant onboarding, recurring-payment enablement, and webhook configuration are complete.

## Confirmed live-schema details

- `subscription_plans` uses `monthly_price numeric` and `token_allowance integer`.
- The app's active subscription table is `user_subscriptions` with `current_period_start` and `current_period_end`.
- The token ledger used by `get_my_token_balance()` is `token_transactions`; `premium_monthly` is an allowed transaction type.
- Publishing uses the 7-argument or 8-argument `publish_item(...)` RPC and charges 5 tokens.
- A legacy `subscriptions` table and `token_ledger` also exist; this migration leaves them unchanged.
- The current `user_subscriptions` status constraint permits `active`, `expired`, and `cancelled`. The migration expands it to include pending, payment-failure, scheduled cancellation, and provider-halted states.

## Apply in a safe order

1. Review this branch and back up production.
2. Apply `supabase/migrations/20261010100000_roomora_subscription_stage1.sql` only to a development database.
3. Run `supabase/tests/subscription_stage1.sql` against that development database.
4. Inspect RLS/security advisor results and verify existing token balance and publishing tests.
5. Do not merge or apply to production until the migration is tested against the exact deployed schema.

## What this stage adds

- Plan metadata for listing limits, premium features, feature flags, INR currency, PhonePe plan IDs, and separately configured monthly bonus tokens.
- Offer configuration: the ₹10 plan grants 50 base tokens plus 5 clearly identified promotional tokens (55 total). PhonePe's processing fee is a RoomOra merchant expense, not a reduction in the customer's token entitlement. If the actual merchant fee differs from the assumed 2%, RoomOra's net revenue changes; token benefits stay as advertised.
- Provider/customer IDs, cancellation state and payment lifecycle metadata on `user_subscriptions`.
- Payment records, webhook-event idempotency, monthly token grant idempotency and an audit trail.
- `grant_subscription_period_tokens(...)`, callable only by `service_role`, to grant each subscription period's tokens once.

## ₹10 offer rule

For the ₹10 monthly plan, configure `token_allowance = 50` and `monthly_bonus_tokens = 5`. After PhonePe confirms a successful payment server-side, the ledger records the 50 subscription tokens and 5 promotional tokens separately, while the idempotent grant record tracks 55 total. The user-facing notification should say: **“Payment successful! You received 50 subscription tokens + 5 bonus tokens. Total: 55 tokens 🎉”**. Do not tell users the gateway fee reduced their tokens; gateway fees are paid by RoomOra under this offer model.

## Not included yet

- No PhonePe checkout creation or webhook endpoint.
- No UI activation on checkout return. Only a verified server-side PhonePe webhook/status check should activate or renew a subscription.
- No listing-limit enforcement in `publish_item(...)` yet; that must be a separate migration after carefully preserving its existing behavior.
- No production migration has been applied and no payment credentials are required for this stage.

## Next stages

1. Confirm PhonePe merchant onboarding, promotional pricing eligibility, and UPI AutoPay access.
2. Add server-side PhonePe order/subscription creation using secrets stored in Supabase Edge Function secrets.
3. Verify webhook signatures and reconcile payment status with PhonePe's server-side status API; process provider event IDs idempotently.
4. Add atomic lifecycle transitions and verified monthly token grants.
5. Enforce listing limits and premium entitlements in trusted database functions.
6. Wire `SubscriptionsPanel` and the admin plan editor.
7. Test the complete lifecycle in PhonePe's supported test environment before production rollout.

## Official references

- [PhonePe Payment Gateway pricing](https://www.phonepe.com/business-solutions/payment-gateway/pricing/)
- [PhonePe Payment Gateway developer documentation](https://developer.phonepe.com)
- [PhonePe AutoPay terms](https://www.phonepe.com/terms-conditions/autopay/)
