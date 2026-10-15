# RoomOra PhonePe subscriptions — staged rollout

## Agreed offer
- Monthly price: **₹10**
- Base allocation: **50 tokens**
- Launch bonus: **5 tokens**
- Total after each verified successful billing period: **55 tokens**
- RoomOra absorbs the gateway fee; the user's advertised token allocation does not shrink.

## Implemented in this branch
- PhonePe UPI AutoPay mandate setup via PhonePe Standard Checkout's documented `SUBSCRIPTION_CHECKOUT_SETUP` flow.
- Server-side initial order verification plus a PhonePe subscription-status check before activation and token grants.
- A trusted renewal scheduler that checks mandate state and submits the documented redemption-notification request with `autoDebit: true` and `STANDARD` retries 24–48 hours before period end.
- Webhook processing for setup, redemption, and mandate-state events with duplicate-event protection.
- Authenticated subscription-status and cancellation functions, plus a user-facing cancellation control.
- Additional migration fields and a unique index for one renewal order per billing period.
- The subscriptions panel shows the 55-token offer, payment-success notice, current subscription status, and AutoPay cancellation.

## Remaining before production
The code is a draft integration and has not been deployed. Complete these tests against PhonePe's current official merchant docs before enabling real billing:
1. Test mandate setup and initial payment, including a successful server-side subscription status check before granting the first 55 tokens.
2. Configure and test the trusted scheduler's daily invocation and secret.
3. Test renewal success/failure, delayed and duplicate callbacks, paused/revoked mandates, cancellation, refunds, and manual reconciliation.
4. Confirm the required customer notice timing and recurring debit behavior in PhonePe's UAT environment; verify the merchant account is enabled for AutoPay.
5. Add operational monitoring/alerts for renewal notification failures and subscriptions requiring manual reconciliation.

## Secrets (Supabase Edge Function secrets only)
- `PHONEPE_CLIENT_ID`
- `PHONEPE_CLIENT_SECRET`
- `PHONEPE_CLIENT_VERSION`
- `PHONEPE_ENV=sandbox` for testing; use `production` only after approval
- `ROOMORA_SITE_URL`
- `ROOMORA_ALLOWED_ORIGINS`
- `PHONEPE_WEBHOOK_USERNAME`
- `PHONEPE_WEBHOOK_PASSWORD`
- `ROOMORA_SCHEDULER_SECRET` for a trusted scheduler if one is added

Do not commit credentials or put them in Vite/frontend environment variables.

## Required before production
- Apply migrations in order to a development database and run SQL tests.
- Deploy Edge Functions to a development project and set secrets.
- Configure PhonePe webhook authentication and the required event types from the current merchant documentation.
- Test successful setup, rejected/expired setup, duplicate callbacks, renewal success, renewal failure, paused/revoked mandates, cancellation and scheduler retries.
- Confirm PhonePe AutoPay is enabled for RoomOra's merchant account and that the current merchant pricing covers the selected recurring payment mode.
- Review security/performance advisors and existing publishing/token regressions.
- Do not enable production billing until sandbox/UAT passes. No live database migration or Edge Function deployment is performed by this PR.

## Official references
- [PhonePe developer documentation](https://developer.phonepe.com)
- [PhonePe Payment Gateway pricing](https://www.phonepe.com/business-solutions/payment-gateway/pricing/)
- [PhonePe AutoPay terms](https://www.phonepe.com/terms-conditions/autopay/)