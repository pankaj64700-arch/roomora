# RoomOra PhonePe subscriptions — staged rollout

## Agreed offer
- Monthly price: **₹10**
- Base allocation: **50 tokens**
- Launch bonus: **5 tokens**
- Total after each verified successful billing period: **55 tokens**
- RoomOra absorbs the gateway fee; the user's advertised token allocation does not shrink.

## Implemented in this branch
- PhonePe Standard Checkout initial order and server-side order-status verification.
- Additional migration fields for PhonePe AutoPay mandate IDs and renewal-period payment tracking.
- The subscriptions panel shows the 55-token offer and success notice.

## AutoPay implementation still required
Before claiming automatic renewal, implement and test all of these against PhonePe's current official merchant docs:
1. Create the recurring mandate using the PhonePe AutoPay setup flow, with a unique merchant subscription ID, approved monthly frequency and UPI mandate.
2. Verify setup and initial payment with PhonePe's server-side status API. Grant the first 55 tokens only after confirmed successful payment.
3. Add a trusted scheduled renewal worker that checks mandate status, sends any required pre-debit notice, and submits the monthly redemption using the provider's documented API.
4. Grant renewal tokens only after the authenticated webhook arrives and PhonePe's server-side redemption status confirms payment.
5. Handle duplicate callbacks, failed redemptions, retries, paused/revoked mandates, cancellation, refunds and reconciliation idempotently.
6. Add a user-facing cancellation flow and ensure cancel-at-period-end is respected.

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