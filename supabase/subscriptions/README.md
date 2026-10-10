# RoomOra subscription billing — Stage 1

This is a **draft schema foundation** for automatic monthly subscriptions. It is intentionally additive and does not activate payments or change the existing publish flow.

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
4. Inspect RLS and security advisor results, and verify existing token balance and publishing tests.
5. Do not merge or apply to production until the migration is tested against the exact deployed schema.

## What this stage adds

- Plan metadata for listing limits, premium features, feature flags, INR currency and Razorpay plan IDs.
- Provider/customer IDs, cancellation state and payment lifecycle metadata on `user_subscriptions`.
- Payment records, webhook-event idempotency, monthly token grant idempotency and an audit trail.
- `grant_subscription_period_tokens(...)`, callable only by `service_role`, to grant each subscription period's tokens once.

## Not included yet

- No Razorpay checkout creation or webhook endpoint.
- No UI activation on checkout return. Only a verified server-side webhook should activate or renew a subscription.
- No listing-limit enforcement in `publish_item(...)` yet; that must be a separate migration after carefully preserving its existing behavior.
- No production migration has been applied and no payment credentials are required for this stage.

## Next stages

1. Add server-side Razorpay subscription creation using secrets stored in Supabase Edge Function secrets.
2. Verify webhook signatures over the raw request body and process provider event IDs idempotently.
3. Add atomic lifecycle transitions, payment reconciliation and verified monthly token grants.
4. Enforce listing limits and premium entitlements in trusted database functions.
5. Wire `SubscriptionsPanel` and the admin plan editor.
6. Test the full lifecycle in Razorpay test mode before any production rollout.
