# RoomOra — Project Memory

> Living record of durable product decisions, implementation context, verified work, and unresolved risks. Do not store credentials or personal customer data here.

## Latest product decision — 2026-10-12
- Product documentation has been aligned around `docs/prd.md` v2.0.
- Subscription direction changed from PhonePe gateway/AutoPay to **manual UPI QR payment** for the near-term MVP.
- The intended offer discussed is ₹10/month for 50 base tokens + 5 bonus tokens (55 total) after independent verification. Final plan terms, benefits, renewal/expiry, refund and retention policy still need confirmation.
- A normal UPI QR does not notify RoomOra that money settled and cannot by itself automate recurring debits. Payment requests must stay pending until an authorized reviewer checks independent trusted evidence.
- Do not deploy/enable PhonePe checkout, AutoPay, webhook or scheduler functions for the QR-only user flow. Any removal of existing draft code is a separate reviewed repository change. Do not delete payment/audit records to simplify a migration.
- The QR image/payment recipient has not yet been supplied/verified. Do not invent a QR or payment address.
- The PhonePe integration remains draft/unmerged and has not been UAT-verified; it is not a production capability.

## Product state and journeys
- Signed-in users should land in Marketplace rather than a generic overview.
- Marketplace is the main discovery surface for searching, filtering, viewing, saving and inquiring about supported listing categories.
- My Published Items is the dedicated place for owners to edit/delete/manage their own listings.
- Saved Items contains saved listings across all supported categories, not only rooms.
- Newly published active listings and their images should appear in Marketplace and landing-page discovery when their records and image access are valid.
- Search must cover title, description, city and locality/area.
- Empty categories should not appear as blank sections.
- Dashboard modules should be functional and role-scoped, not placeholder-only.

## Architecture and security decisions
- React/Vite owns presentation; hooks/services organize client data access; Supabase Auth identifies users; PostgreSQL RLS, explicit grants, constraints and trusted server-side operations enforce authorization/business rules.
- Frontend hiding/route guards are UX only. Never rely on client-supplied IDs or frontend-only role/email comparisons for authorization.
- Public listing reads expose only intentionally public active/published/non-expired fields.
- User-owned mutations must be enforced by RLS/server-side checks.
- Token ledger changes must be server-validated, auditable and idempotent for retries.
- Service-role keys, database passwords, webhook secrets and provider private credentials must never enter browser bundles, `VITE_*` variables, Git, logs, screenshots or chat.
- Listing images and private payment proof must have separate access policies; proof must not be public.
- Logs/analytics should be minimized and redacted; never log secrets, auth headers, private message bodies or payment screenshots.
- Migrations should be incremental and tested in a development/disposable environment before production.

## Existing marketplace/dashboard work recorded in project history
- Shared marketplace definitions/utilities, MarketplaceImage, MarketplaceFilters, MarketplaceCard, useMarketplaceItems, useSavedItems, MarketplaceToolbar and MarketplaceRows were introduced.
- Landing marketplace and Saved Items were migrated toward shared marketplace infrastructure.
- My Published Items uses shared marketplace cards/forms/modals; owner cards omit Save because saving is a discovery action.
- Reusable Button, Input, Badge, SearchInput and Toast primitives were added.
- Design tokens and shared UI styles were introduced in `src/styles/design-tokens.css` and `src/styles/ui.css`.
- Dashboard navigation uses browser history/`popstate` for Back behavior.
- Data-driven dashboard workspace modules were added for Users, Products, Inquiries, Contacts and Orders with search/refresh/loading/empty/error/action states.
- These notes reflect previously recorded work; re-run current tests and inspect the branch before assuming each behavior remains correct.

## Current branch/release context
- Work has been recorded on branch `feat/subscriptions-stage-1` in draft PR #1.
- PR: https://github.com/pankaj64700-arch/roomora/pull/1
- The expanded PRD update was committed as `ad4a072ef3caf5bf610a936103e8051d95e060e8`.
- The architecture, rules, task board and memory updates are being committed to the same draft branch as focused documentation commits.
- The PR remains draft/unmerged unless GitHub status is checked and proves otherwise.
- No production deployment should be claimed unless a deployment record and deployed URL have been verified.
- Passing CI/build is not proof of correct production RLS, storage policies or payment settlement.

## Known risks and open questions
- Perform a real audit of exposed tables, grants, RLS policies, RPC grants, Storage policies, admin role enforcement and secrets before production.
- Confirm actual database table/column names against current migrations before changing policy/schema.
- Verify token transaction type constraints against all current publishing/reward code paths.
- Confirm how to verify manual QR payments independently and which trusted person may approve them.
- Decide payment proof retention, account deletion/data export, inquiry retention, privacy-conscious analytics and operational log retention.
- Confirm subscription terms and the precise behavior a subscription unlocks.
- Complete owner room CRUD, role-specific overview, Publish Item form migration, dashboard design-token migration and duplicate CSS cleanup.
- Verify published item images, city/locality search, empty states and responsive Android behavior.

## Documentation responsibilities
- `docs/prd.md`: product behavior and acceptance criteria.
- `docs/architecture.md`: trust boundaries, components and data flow.
- `docs/design.md`: visual design, accessibility and interaction requirements.
- `docs/rules.md`: mandatory engineering/security/privacy constraints.
- `docs/tasks.md`: active work and verification checklist.
- `docs/memory.md`: durable decisions and important history.

## Working rules
- One focused task at a time; inspect before editing.
- Preserve working behavior and avoid unrelated refactors.
- Reuse shared components/hooks/tokens.
- Do not store secrets or actual customer data in repository docs.
- Record what was tested and what remains unverified.
- Do not call the product secure, complete or deployed without evidence.


## UI decision — 2026-10-19
- The user prefers the marketplace card flow to return to vertical page scrolling because it feels easier and clearer.
- Category sections remain stacked vertically; cards within each section use a responsive grid (4 desktop / 3 tablet / 2 mobile) instead of horizontal scrolling rails.
- Reuse the shared `MarketplaceCard` and its compact visual treatment; avoid unrelated layout or data-flow changes in this pass.
