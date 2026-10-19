# RoomOra — Task Board

> **Aligned with:** `docs/prd.md` v2.0, `docs/architecture.md` v2.0, `docs/rules.md` v2.0  
> **Rule:** check off work only after implementation and verification. Documentation is not proof that a control exists.

## Current focus
### Priority 0 — Security and product-flow audit
- [ ] Inventory exposed tables/views, table grants, RLS policies, triggers, RPCs and function grants.
- [ ] Verify RLS is enabled for every exposed table containing user or business data.
- [ ] Add/test explicit owner and participant policies for listings, saves, inquiries, profiles, token ledger and subscription/payment records.
- [ ] Audit admin authorization; remove reliance on frontend-only role/email checks.
- [ ] Audit public listing projections for private profile/contact fields and moderation metadata.
- [ ] Audit Storage policies for public listing images and private payment proof; ensure they cannot share an accidental public access path.
- [ ] Search frontend build configuration and source for accidentally exposed service-role keys, database passwords or other private secrets; do not print secret values in reports.
- [ ] Verify client cannot mutate token balances, transaction type, role flags, payment approvals or subscription state directly.
- [ ] Add policy tests for anonymous, user A, user B, owner/seller and admin.
- [ ] Test altered IDs/direct API calls to confirm frontend restrictions are not the only boundary.
- [ ] Review Supabase security and performance advisories and document remediation.

### Priority 1 — Marketplace and dashboard
- [x] Add centralized design tokens.
- [x] Add reusable UI transition primitives.
- [x] Add reusable Modal and EmptyState.
- [x] Add reusable marketplace utilities, image/filter/card components and shared marketplace/saved-items hooks.
- [x] Migrate landing marketplace and Saved Items to shared marketplace infrastructure.
- [x] Preserve search across title, description, locality/area and city.
- [x] Extract reusable Button/Input/Badge/Search/Toast primitives.
- [x] Add Android-friendly touch sizing and reduced-motion behavior to shared UI.
- [x] Migrate My Published Items to shared marketplace cards/forms/modals.
- [x] Reuse marketplace search and category filters on landing/marketplace and My Published Items.
- [x] Define browser-history navigation behavior and support Android/system Back via `popstate`.
- [x] Replace placeholder dashboard modules for Users, Products, Inquiries, Contacts and Orders with data-driven workspace panels.
- [x] Add workspace search, refresh, loading, empty, error and action states.
- [ ] Complete owner room management CRUD (edit/delete/status) using reusable components.
- [ ] Improve non-admin Overview into a role-specific summary.
- [ ] Migrate Publish Item to shared form primitives.
- [ ] Migrate dashboard styles onto design tokens.
- [ ] Remove duplicated/obsolete marketplace and dashboard CSS/logic after verifying replacements.
- [ ] Verify published item images appear on landing and marketplace only when eligible and correctly accessible.
- [ ] Verify search/filter combinations do not show unrelated results or blank categories.
- [ ] Run responsive tests for Android/mobile, tablet and desktop.
- [ ] Run build/lint/tests and UI smoke tests.

### Priority 2 — QR-only subscription workflow
- [ ] Confirm subscription price, period, benefits, token reward, expiry/cancellation and refund/support rules.
- [ ] Obtain and verify the owner's intended UPI QR through a secure configuration process; do not invent or hard-code unverified payment details.
- [ ] Remove PhonePe checkout/AutoPay controls from the user-facing subscription UI.
- [ ] Keep gateway-specific code disabled and undeployed while QR-only mode is active.
- [ ] Design a private `pending_review` payment-request state with user-scoped reads.
- [ ] Implement authorized admin payment-review UI and server/database-enforced approval permissions.
- [ ] Define independent payment-verification procedure; screenshots and client-submitted references alone must not auto-approve.
- [ ] Implement idempotent approval that records reviewer/audit metadata, subscription period and token grant safely.
- [ ] Ensure the current discussed offer grants 50 base + 5 bonus tokens (55 total) only after verified approval.
- [ ] Add user-facing pending/approved/rejected/expired states and clear manual-renewal messaging.
- [ ] Add privacy-protected proof upload only if truly needed; private bucket, least-privilege access and retention policy required.
- [ ] Test duplicate submission/approval, invalid reference, rejected payment, concurrent approvals and token grant failure.
- [ ] Update PRD/architecture/rules/tasks/memory whenever subscription terms or payment method changes.

### Priority 3 — Data correctness and privacy lifecycle
- [ ] Verify publish token deduction and listing creation are atomic or safely recoverable.
- [ ] Add idempotency guards for retryable publish charges, token grants and other critical operations.
- [ ] Confirm allowed `token_transactions` types match every actual publishing/reward path.
- [ ] Verify expired/unpublished/rejected/deleted listings disappear from public discovery.
- [ ] Define retention and deletion policy for inquiries, logs, payment evidence, user accounts and audit records.
- [ ] Define account deletion/data export behavior without deleting records that must be retained.
- [ ] Minimize analytics/log payloads and redact secrets, personal contact data and payment evidence.
- [ ] Add rate limiting/abuse controls for publishing, uploads, inquiries and payment submissions.
- [ ] Review security headers, dependency alerts, redirect allowlists and safe error responses.

### Priority 4 — Release readiness
- [ ] Apply migrations in development/staging before production.
- [ ] Run build, type checks, SQL/migration tests, policy tests and relevant integration tests.
- [ ] Verify Auth, listing publish/edit/delete, image upload, save/unsave, inquiries and token flows using test identities.
- [ ] Verify QR payment requests remain pending until authorized independent verification.
- [ ] Verify duplicate approvals cannot grant duplicate tokens/periods.
- [ ] Review Supabase security/performance advisors.
- [ ] Confirm secrets are configured only in the correct server-side environment.
- [ ] Deploy preview/staging and verify the actual deployed URL.
- [ ] Production release requires explicit approval and a recovery plan.
- [ ] Verify production core flows separately from CI and record the exact deployment checked.
- [ ] Update `docs/memory.md` with actual completed work and unresolved risks.

## Backlog
- [ ] Centralize typography tokens.
- [ ] Add standardized skeleton components.
- [ ] Add error boundary strategy.
- [ ] Add route/page loading states.
- [ ] Add automated UI smoke checks for core flows.
- [ ] Add aggregate privacy-conscious operational metrics.

## Product invariants
- Signed-in users land on Marketplace.
- Search supports city and local area/locality as well as listing text.
- Saved Items covers all supported listing categories.
- Users manage only their own listings; marketplace discovery is not an owner CRUD surface.
- Public discovery shows only active, published, non-expired listings.
- Tokens and subscription rewards are server-validated, auditable and retry-safe.
- QR-only payments require manual independent verification; ordinary QR does not automate recurring debits.
- Never expose privileged API keys, service-role credentials, private payment proof or unrelated user data.
- Shared UI and business logic should be reused where behavior is the same.

## UI density and Android requirements
Use compact, readable cards, modest gaps, comfortable touch targets, horizontal discovery rails where appropriate, and responsive owner grids. Do not make the UI extremely tight or overly spacious. Respect keyboard/focus and reduced-motion behavior.

## Task discipline
Complete tasks in focused batches. Do not start unrelated workstreams without recording them here. Check boxes only after tests/evidence confirm completion.


## UI revision — vertical marketplace card flow (2026-10-19)
- [x] Replace horizontal listing rails with a responsive card grid in the shared marketplace stylesheet.
- [x] Keep category sections stacked vertically and retain shared compact card styling.
- [ ] Verify public landing and signed-in marketplace at mobile, tablet and desktop widths; confirm no horizontal page overflow.
- [ ] Confirm Vercel preview/build after the change is merged or deployed.
