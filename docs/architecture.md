# RoomOra — System Architecture

> **Version:** 2.0  
> **Aligned with:** `docs/prd.md` v2.0  
> **Status:** Intended architecture; verify against current code, migrations, and deployed configuration before treating any statement as implemented.

## 1. Architecture principles
- Feature-first organization with reusable UI primitives and shared marketplace domain logic.
- Supabase is the source of truth for persistent product data.
- React components own presentation; hooks/services own client-side data orchestration; PostgreSQL policies/functions and authenticated Edge Functions enforce sensitive business rules.
- RLS is a primary authorization boundary for user-owned rows, supported by explicit grants and server-side validation.
- The frontend is untrusted. Hidden UI, route guards, disabled buttons, and client-supplied IDs are not authorization.
- Public responses must contain only approved public fields.
- Use additive, reviewable migrations and test changes in development before production.
- QR-only subscription mode is manual-payment mode. A QR code alone cannot verify settlement or automate recurring debits.

## 2. System context

```text
Browser (React + Vite)
  ├─ UI components / pages
  ├─ feature hooks and domain utilities
  └─ Supabase client
       ├─ Supabase Auth (identity/session)
       ├─ Postgres API (publishable key + current user JWT)
       │    ├─ RLS and explicit grants
       │    ├─ constrained tables / views
       │    └─ validated RPCs for atomic business operations
       └─ Storage (bucket policies and object paths)

Trusted server-side operations (only when needed)
  └─ Supabase Edge Functions
       ├─ verify caller identity and authorization
       ├─ validate request schema and rate limits
       ├─ keep privileged secrets server-side
       └─ call external services only from server context
```

The publishable/anon key is not an authorization system. All exposed tables and functions must be secured. Service-role keys, database passwords, webhook secrets, and other privileged credentials must never be bundled into the browser.

## 3. Frontend layers

```text
Pages / Panels
  ↓
Feature components
  ↓
Shared UI primitives (Button, Input, Modal, Toast, EmptyState, Badge)
  ↓
Feature hooks / domain utilities
  ↓
Supabase client (publishable key + user session)
  ↓
RLS-protected Postgres / Storage / Auth
```

- Presentation components should not contain duplicated business rules.
- Reuse shared marketplace cards, filters, image resolution, category definitions, and hooks.
- Route guards improve navigation UX but do not replace database/function authorization.
- Signed-in navigation defaults to Marketplace.
- Personal screens query only data belonging to the current user or records shared with them by a defined policy.

## 4. Repository organization

Use the current repository structure as the source of truth; names below describe logical responsibilities, not a mandate to move files without a focused task.

```text
src/
  components/
    marketplace/   shared marketplace cards, filters, image and domain utilities
    ui/            reusable controls, modal, toast, empty/loading/error states
  hooks/           shared client data hooks
  pages/panels/    Marketplace, Saved Items, My Published Items, Publish Item
  styles/          design tokens and shared UI styles
supabase/
  migrations/      versioned schema/policy changes
  functions/       server-side operations requiring trusted execution
  tests/           SQL/policy/transaction tests
docs/
  prd.md
  architecture.md
  design.md
  rules.md
  tasks.md
  memory.md
```

## 5. Data domains

Confirm exact names and columns against migrations before editing. Existing product concepts include:

- `marketplace_items`: listing metadata, owner, category, status, visibility, location and timestamps.
- `marketplace_favorites`: user-to-listing saves.
- `marketplace_inquiries`: inquiry records and relevant participants/listings.
- `token_transactions`: append-oriented token ledger.
- Supabase Storage: listing image objects.
- Supabase Auth and the application profile/role model: identity and minimal profile data.
- Subscription/payment request records: only the approved QR/manual-review flow should be active for the current product direction.

A table name is not a promise that policies are safe. Audit table grants, RLS, constraints, triggers, RPC grants and storage policies as a combined boundary.

## 6. Authorization and trust boundaries

### Public reads
- Expose only active, published, non-expired listings.
- Return only fields intended for public discovery; avoid selecting `*` where a safe projection/view can be used.
- Do not include private contact data, drafts, moderation notes, internal audit data, payment requests, or user saves.

### Authenticated user operations
- Use `auth.uid()` or the verified user identity in trusted code as the actor.
- RLS policies enforce owner/participant boundaries on reads and mutations.
- Validate listing status, allowed fields, amount, role and token balance server-side.
- Do not accept a client-supplied user ID as proof of ownership.
- Add unique constraints/idempotency guards to operations that can be retried.

### Administrative operations
- Verify admin role from a trusted database claim/profile source or server-side policy; a frontend email comparison is not enough.
- Separate privileged approval operations from normal user writes.
- Audit moderation, role changes, token adjustments, and payment decisions.
- Return only the minimum fields needed by the admin task.

### Edge Functions
- Verify JWT by default.
- For webhooks, use the provider's required signature/authentication scheme, timestamp/replay controls, and strict request validation. A public webhook must not simply turn JWT verification off without a documented alternate authentication design.
- Keep secrets in Supabase Edge Function secrets, never in `VITE_*` variables.
- Add request size limits, rate limits where appropriate, timeouts, safe error messages and correlation IDs.
- Restrict CORS to expected origins but never treat CORS as authorization.

## 7. Data-flow diagrams

### 7.1 Browse/search
```text
Visitor or signed-in user
  → landing/Marketplace UI
  → bounded query with title/description/city/locality filters
  → RLS + public visibility constraints
  → minimal public listing projection
  → shared MarketplaceCard / MarketplaceImage
```

The same category and location semantics should be reused across Landing, Marketplace and My Published Items, with queries constrained to the relevant visibility/ownership scope.

### 7.2 Authentication
```text
Browser → Supabase Auth → session
        → minimal own-profile/role query
        → signed-in navigation defaults to Marketplace
        → each data request independently passes RLS or server authorization
```

A valid session identifies a user; it does not grant access to every record.

### 7.3 Publish listing
```text
Form validation (UX only)
  → authenticated Storage upload with size/type/path policy
  → trusted publish RPC or server operation
       ├─ validate caller, category, fields, state and token balance
       ├─ atomically record token deduction and listing state where feasible
       └─ use idempotency protection for retries
  → return listing ID/status
  → public query displays only eligible listing
```

If upload and database write cannot share one transaction, model the intermediate state and safely clean up orphaned uploads. Never report success before the authoritative operation succeeds.

### 7.4 Save and inquiry
```text
Save/unsave → authenticated user/listing relation → ownership RLS + unique constraint
Inquiry     → validated listing + participant rules → authorized inquiry record
```

Do not return unrelated user profiles or private contact fields.

### 7.5 Manual QR subscription (current direction)
```text
User sees configured QR and clear terms
  → payment occurs outside RoomOra
  → user submits a claimed reference / optional private proof
  → request remains pending_review
  → authorized reviewer checks payment through trusted independent evidence
  → atomic approval operation records decision, period, audit and token grant
  → user reads only their own status and token history
```

- QR scan is not a payment callback.
- A screenshot/reference submitted by the user is not sufficient by itself to prove settlement.
- Manual monthly renewal and reminders are allowed; automated debit is not available in QR-only mode.
- The discussed offer is ₹10 per month for 50 base tokens + 5 bonus tokens after verification. Store offer rules centrally and show full terms.
- Payment approval and token grants must be retry-safe and idempotent.
- PhonePe-specific gateway/AutoPay code on the draft branch is not part of this intended QR-only user flow and must not be deployed/enabled for it. Any removal from the repository must be a separate reviewed change that preserves relevant audit history.

## 8. Token ledger and consistency
- Client-side code cannot write arbitrary balances, token transaction types, or rewards.
- Use a trusted database function/transaction for token deduction/grant and the related business state.
- Enforce allowed transaction types with database constraints.
- Add a stable idempotency key or unique business reference for publish charges, payment approval and subscription-period grants.
- Prevent the listing from being published if the required token deduction fails.
- Prevent the subscription from being shown as fully approved if its token grant fails; use an atomic transaction or explicit recoverable state.
- Do not edit/delete historical ledger rows as a shortcut to fix business state; use a corrective compensating entry and audit it.

## 9. Storage and image handling
- Public listing images and private payment proof must use separate buckets or equally strong policy separation.
- Public listing images become publicly readable only when the product intends them to be public.
- Private proof uses authenticated policies and short-lived signed access when required.
- Enforce upload limits, content-type allowlists, safe randomized paths, owner checks and safe deletion.
- Do not let client-supplied paths permit cross-user overwrite/delete.
- Use image dimensions/lazy loading/fallbacks for UI; remove EXIF/location metadata where feasible.

## 10. API and secret management
- Browser code may use only a publishable project key designed for client use, with RLS and grants correctly configured.
- Service-role/secret keys, database credentials, webhook credentials and provider secrets remain server-side.
- Keep local environment files out of Git and use sanitized placeholders in `.env.example`.
- Never log authorization headers, session tokens, API keys, private messages, full payment proof or unnecessary personal data.
- Validate input schemas, limit pagination and response fields, handle errors generically for clients, and keep sensitive diagnostics redacted.
- Use HTTPS/TLS for network traffic and verify external webhook authenticity before changing trusted state.
- Rotate exposed credentials and investigate access if any secret is committed or sent to an untrusted destination.

## 11. Observability and audit
Use correlation IDs and minimal structured logs. Track safe operational facts such as operation name, status category, latency, internal record ID and timestamp. Do not log credentials, session tokens, private message bodies, screenshots or unnecessary personal data.

Audit role changes, moderation, token grants/adjustments, manual payment approvals/rejections and destructive operations. Keep retention periods documented and limit log/audit access.

## 12. Testing and release gates
Before production release:
1. Apply migrations to a development/staging database first.
2. Test anonymous, user A, user B, owner/seller and admin access separately.
3. Prove that changing IDs in requests cannot bypass RLS.
4. Verify private storage access and public-field projections.
5. Test token deduction/grant atomicity, retries and duplicate submissions.
6. Test that unverified QR requests stay pending and proof is private.
7. Run build, type checks, SQL tests, policy tests and relevant UI smoke tests.
8. Review Supabase security/performance advisors and fix launch-blocking findings.
9. Verify secrets are present only in the correct environment.
10. Verify the deployed URL and core flows independently of CI.
11. Update `docs/tasks.md` and `docs/memory.md` with actual outcomes.

A passing build does not prove correct RLS, safe storage policies, payment settlement or production deployment.

## 13. Related documentation
- Product scope and acceptance criteria: `docs/prd.md`
- Visual and interaction requirements: `docs/design.md`
- Non-negotiable engineering rules: `docs/rules.md`
- Active backlog and security audit plan: `docs/tasks.md`
- Durable decisions and implementation notes: `docs/memory.md`
