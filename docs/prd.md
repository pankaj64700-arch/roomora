# RoomOra — Product Requirements Document (PRD)

> **Document status:** Living product specification  
> **Version:** 2.0  
> **Last updated:** 2026-10-12  
> **Owner:** RoomOra product team  
> **Implementation baseline:** React + Vite, Supabase, GitHub, Vercel  
> **Source of truth:** This document defines intended product behavior. It does not prove a feature is implemented, tested, or deployed. Check `docs/tasks.md`, `docs/architecture.md`, migrations, tests, and deployment records for implementation status.

## 1. Purpose and how to maintain this document

This PRD describes RoomOra's product goals, user journeys, functional requirements, data lifecycle, privacy/security expectations, acceptance criteria, and rollout rules. It is intended to prevent implementation drift and make decisions understandable before code changes.

### Document maintenance rules
- Update this PRD when a product requirement, role, permission, price, token rule, or core user journey changes.
- Record architectural implementation details in `docs/architecture.md`, non-negotiable engineering constraints in `docs/rules.md`, active work in `docs/tasks.md`, and dated decisions/completed work in `docs/memory.md`.
- Do not silently change the meaning of a requirement. Add a dated decision note and update affected docs/tests.
- Mark requirements as **MUST**, **SHOULD**, or **MAY**:
  - **MUST**: launch-blocking behavior or security/privacy invariant.
  - **SHOULD**: important quality requirement; exceptions must be recorded.
  - **MAY**: optional future capability.
- Do not describe work as shipped until tests pass and the relevant environment has been checked. A passing build is not proof of secure policies, correct business behavior, or a successful production deployment.
- Do not store credentials, private user information, payment screenshots, access tokens, or real customer records in this document, source control, issues, screenshots, or test fixtures.

## 2. Product overview

RoomOra is a mobile-friendly room-discovery and general marketplace application, initially aimed at students, renters, room owners, and small sellers. It brings room listings and useful marketplace goods—such as furniture, stationery, second-hand items, and other supported categories—into one place.

RoomOra helps people:
- discover rooms and marketplace items by city and locality;
- publish and manage their own listings;
- save listings across supported categories;
- contact or inquire about a listing without exposing private account data unnecessarily;
- manage a token balance used for eligible publishing/actions;
- optionally request subscription benefits through a transparent, manually verified QR-payment process while automated payment integration is out of scope.

### Product principles
1. **Marketplace first:** signed-in users land on Marketplace, not Overview.
2. **Privacy by default:** show only data required for a public listing or a specific authorized workflow.
3. **Server-enforced security:** frontend checks improve UX but never replace database policies or server-side authorization.
4. **Trustworthy state:** payments, tokens, ownership, expiry, and moderation decisions must be persisted and verified server-side.
5. **One source of truth:** use shared components and shared domain/data logic rather than parallel implementations.
6. **Low-cost, incremental delivery:** preserve working features, use migrations, and validate changes in a development environment before production.
7. **Mobile usability:** Android-compatible touch controls, responsive layouts, horizontal discovery rails where useful, and readable density—not cramped or excessively spacious.
8. **No hidden automation:** if a person must verify a payment or contact, the UI must say so clearly.

## 3. Goals and success criteria

### Goals
- Provide a coherent public landing/discovery experience and authenticated marketplace.
- Support safe listing creation, image upload, editing, expiry, and deletion by the listing owner.
- Make search/filtering work across item title, description, city, and locality/area.
- Support save/unsave for all supported listing categories.
- Provide role-appropriate dashboards with useful, permission-scoped modules.
- Preserve a reliable token ledger and avoid duplicate charges or grants.
- Protect user data, API credentials, and privileged backend operations.
- Make the subscription process understandable and affordable to operate.

### Success criteria
- A successful sign-in returns the user to Marketplace.
- A listing created by a user appears in the correct authenticated owner list and, once eligible/published, in public discovery and landing-page item rails.
- Users can edit/delete only their own listings, except an authorized admin moderation action.
- Saved Items contains all saved supported categories, not just rooms.
- Searching a city and locality returns matching active listings and does not render empty category blocks as if results exist.
- Unauthorized direct API/database requests fail even when the caller bypasses the UI.
- Public API responses and storage URLs do not reveal service credentials, private contact data, moderation notes, or unrelated records.
- Token grants and deductions are traceable, validated, and idempotent where an operation may be retried.
- A QR-based subscription is never activated solely because the user submits a screenshot or unverified reference number.
- Build, migration, policy, and relevant flow tests pass before a release is declared ready.

## 4. Users, roles, and access boundaries

Roles are application concepts and must be backed by trusted profile/role data and server-side checks. A user must not be able to grant themselves a role by changing frontend state or editing a request.

### Visitor
- View public landing page and eligible published listings.
- Search and filter public items.
- Open public listing details.
- Must sign in for saving, publishing, private contact/inquiry actions, subscription status, and personal dashboards where required.

### Tenant / general marketplace user
- Browse all supported marketplace categories.
- Save and unsave any supported item.
- Publish permitted item types if allowed by product policy and token balance.
- View and manage their own listings and saved items.
- Submit inquiries or use permitted contact flows.
- View own token activity and subscription/payment request status.

### Room owner
- All general marketplace capabilities.
- Create and manage own room listings, including edit, status changes, and deletion where supported.
- View inquiries related to their listings only.
- Never access another owner's private inquiries or account details.

### Shop / seller
- Browse, save, and publish permitted products.
- Manage only their own products and related authorized order/inquiry data.
- No access to another seller's private customer records.

### Administrator
- Access protected administrative modules such as moderation, users, listing review, token/subscription audit, and analytics, according to a separately verified admin authorization policy.
- Admin privileges MUST be verified server-side. A hard-coded email check in a React component is not a sufficient security boundary.
- Admin actions must be auditable. Admin views should show only fields needed for the task.
- Admin access must not imply unrestricted exposure of secrets, authentication credentials, or unnecessary private user content.

### Role and permission rules
- Default to least privilege.
- Use explicit policies per table, storage bucket, RPC, and Edge Function.
- Ownership checks compare the authenticated UID to the trusted owner field in the database.
- Never accept a user ID from the client as proof that the caller owns that user's records.
- Deny by default when role/profile information is missing, stale, or invalid.

## 5. Main product journeys

### 5.1 Landing and discovery
1. Visitor opens RoomOra.
2. Landing page displays a compact hero with background image/overlay and clear search.
3. Search and category filters refine the supported active listings.
4. Compact horizontal rails/cards show eligible published items; each card prioritizes image, title, and price or the most relevant category-specific value.
5. Selecting an item opens its details. Sign-in is requested only for actions that require an account.

### 5.2 Authentication
1. User signs up or signs in through Supabase Auth.
2. Email confirmation should remain enabled for normal user accounts where supported by the configured auth flow.
3. The app reads the authenticated identity and the minimum profile/role fields needed for navigation.
4. Signed-in users land on Marketplace.
5. Private data queries are authorized by Supabase policies, not by the fact that the UI is hidden.
6. Sign-out clears local user-specific UI state and ends the Supabase session.

### 5.3 Search and filtering
- Search should cover title, description, category-relevant text, city, and locality/area.
- City and locality must be independently searchable, including local areas within a city.
- Category filters must combine correctly with text/location filters.
- Empty categories with zero matching results should be hidden or show one intentional contextual empty state, not a collection of blank sections.
- Filters must not broaden results beyond the active query due to faulty OR conditions.
- Use pagination or bounded result limits; do not download the entire database to the browser.
- If a filter is unsupported or fails, show a recoverable error rather than silently displaying unrelated results.

### 5.4 Publish a listing
1. Authenticated user opens Publish.
2. Form validates required fields and length/type limits.
3. User selects supported category and enters only relevant fields.
4. Image uploads go to the intended Supabase Storage bucket (currently referenced as `marketplace-images`) with safe size/type constraints.
5. A trusted database operation validates ownership, permissions, listing state, and token cost before publication.
6. Listing metadata is persisted in PostgreSQL; image object paths are referenced by the listing.
7. UI confirms the result only after the server operation succeeds.
8. Published, active, non-expired items become discoverable in Marketplace and landing-page rails.
9. Failure leaves no misleading success message; any orphaned upload is cleaned up safely where possible.

### 5.5 Edit, unpublish, delete, and expiry
- Owners may modify only their own listings.
- Edits must validate the same field rules as creation.
- Deletion/unpublishing must update discoverability immediately after successful persistence.
- Where retention or audit requirements apply, prefer a soft-delete/status transition before irreversible deletion.
- Associated images must be deleted only when no longer referenced and when the caller is authorized; never let a user delete another user's objects by guessing a storage path.
- Expired, hidden, rejected, or deleted listings must not appear in public discovery.
- Admin moderation actions must record actor, timestamp, target, and a reason code without placing unnecessary sensitive data in logs.

### 5.6 Save and unsave
- Saving is a user-specific relation between the authenticated user and listing.
- A user can save any supported category; Saved Items must not assume that all records are rooms.
- Prevent duplicate saves with a database uniqueness constraint or equivalent atomic operation.
- Users can see/remove their own saved items only.
- Saving must not transfer ownership or reveal private listing data.

### 5.7 Inquiry/contact
- An inquiry must reference a valid, visible listing and the authenticated initiating user.
- Prevent self-inquiry unless an explicitly designed use case requires it.
- Return only the contact or inquiry details required by the workflow.
- Do not expose a full profile record or private email/phone/address to every marketplace visitor.
- Rate-limit repeated inquiries and provide abuse/report controls.
- Never include private contact data in public listing JSON by default.

### 5.8 Subscription and tokens — current product direction
**Decision as of 2026-10-12:** remove the PhonePe gateway checkout/AutoPay from the intended user-facing subscription flow and use the owner's supplied UPI QR code for manual payment. The QR image has not yet been supplied/verified in this document; do not invent a QR or payment address.

**Offer currently discussed:** ₹10 for a monthly subscription, with 50 base tokens plus 5 bonus tokens (55 total) after a payment is verified and accepted. Price, offer period, benefits, expiry, and refund rules must be displayed clearly and configured centrally, not duplicated as arbitrary frontend constants.

**Manual QR flow**
1. User opens Subscriptions and sees price, period, what the subscription includes, the supplied QR image, and the payment instructions.
2. User pays through their own UPI app outside RoomOra.
3. User submits a transaction reference and optional proof only if the operator requires it. The app explains that submission does not itself confirm payment.
4. The subscription/payment request enters `pending_review`.
5. An authorized admin checks the payment through a trusted source outside the user-submitted screenshot/reference and records a decision.
6. On approval, one atomic server-side operation records the verified payment, subscription period, audit event, and eligible token grant. Retries must not grant the same reward twice.
7. On rejection, the user sees a neutral reason/status and can contact support or resubmit if permitted.
8. Renewal is manual: the app may send reminders, but must not claim it automatically debits the user.
9. Cancellation means no future manual renewal is expected; access/benefit expiry follows the displayed policy.

**Payment safety rules**
- A QR code alone does not send payment confirmation to RoomOra.
- Screenshots and client-submitted transaction IDs are untrusted evidence, not proof of settled payment.
- Do not automatically grant tokens based solely on a screenshot, form submission, query parameter, or frontend state.
- Do not collect UPI PINs, OTPs, banking passwords, card data, or other payment credentials.
- Do not store full bank statements or more payment evidence than necessary.
- Restrict proof uploads to authorized reviewers; use private storage and short-lived signed access where available.
- Record minimal audit metadata: internal request ID, amount, claimed reference, decision, reviewer, timestamps, and a provider/bank reference only when appropriate. Do not put full proof or sensitive banking details in application logs.
- The current PhonePe-specific Edge Functions, credentials, webhook handlers, scheduler, and mandate controls are not part of the desired QR-only MVP. They must not be deployed or enabled for the QR-only flow. Retire their code/secrets only through a reviewed change that preserves audit history and avoids destructive production changes.
- Full automatic renewal is out of scope for QR-only mode. It requires a supported mandate/provider/bank integration or a reliable authorized transaction feed, and a reviewed legal/compliance flow.

### Token ledger requirements
- Token balance is derived from trusted ledger entries or an equally auditable server-side balance mechanism.
- Client code must never write arbitrary token amounts or transaction types.
- Token deduction and listing creation should be atomic to prevent publishing without the required balance or charging twice.
- A retry of a successful request must not duplicate its charge or reward.
- Each transaction should contain the user, signed amount, allowed transaction type, concise description/reference, timestamp, and a stable idempotency key where appropriate.
- Database constraints must enforce valid transaction types and amount semantics.
- A token grant failure must not leave a paid subscription falsely marked as active; use a transaction or a recoverable state machine.

## 6. Functional requirements catalogue

| ID | Priority | Requirement |
|---|---|---|
| FR-001 | MUST | Public landing page supports discovery of eligible published items. |
| FR-002 | MUST | Every authenticated role lands on Marketplace after sign-in. |
| FR-003 | MUST | Search covers title, description, city, and locality/area. |
| FR-004 | MUST | Category and location filters compose correctly and avoid unrelated results. |
| FR-005 | MUST | Empty result/category states are intentional and readable. |
| FR-006 | MUST | Authenticated users can save/unsave all supported listing categories. |
| FR-007 | MUST | Users can create and manage only permitted listing types and only their own records. |
| FR-008 | MUST | Listing image uploads validate size/type and enforce storage access policy. |
| FR-009 | MUST | Only active, published, non-expired listings appear in public discovery. |
| FR-010 | MUST | Inquiry/contact operations validate listing state, caller identity, and abuse limits. |
| FR-011 | MUST | Token deductions/grants are server-validated, auditable, and retry-safe. |
| FR-012 | MUST | Admin authorization is enforced by trusted server-side policies. |
| FR-013 | MUST | Private user information is not included in public listing responses. |
| FR-014 | MUST | No service-role key, private provider secret, or privileged credential ships to the browser. |
| FR-015 | MUST | QR subscription requests remain pending until independently verified by an authorized reviewer. |
| FR-016 | MUST | The same verified payment cannot grant duplicate subscription benefits or tokens. |
| FR-017 | MUST | Users can see their own subscription/payment request status and token activity only. |
| FR-018 | SHOULD | User receives clear status notifications for listing, inquiry, payment request, and subscription changes. |
| FR-019 | SHOULD | Shared marketplace UI/data logic is reused across landing, Marketplace, Saved Items, and My Listings. |
| FR-020 | SHOULD | Dashboard modules are functional and role-scoped, with loading/error/empty/success states. |
| FR-021 | SHOULD | Responsive UI respects Android touch use, keyboard navigation, focus, and reduced-motion settings. |
| FR-022 | MAY | Add a compliant automatic payment provider/mandate integration after a separate decision and UAT. |

## 7. Data inventory and privacy classification

The exact database schema must be checked against current migrations before any schema change. The following describes intended categories, not a guarantee that every field/table already exists.

| Data category | Examples | Visibility and handling |
|---|---|---|
| Identity/auth | Supabase user ID, verified email, auth metadata | Private; managed by Supabase Auth. Never expose password hashes, tokens, or auth internals. |
| Profile | Display name, contact email/phone, contact address/area, role flags | Private by default; publish only explicitly approved fields needed for a listing/workflow. |
| Listings | Title, description, price, category, city, locality, status, expiry, owner ID | Public only when published/active and not expired; private drafts remain owner-only. Avoid precise home address unless essential and intentionally disclosed. |
| Listing images | Storage object path and image content | Public only when intentionally attached to a public listing; reject unsafe files and strip metadata where feasible. Private payment proofs must never share a public bucket. |
| Saves | User ID and listing ID | Private to the saving user; never publish a user's saved-item list. |
| Inquiries/chat | Participants, listing ID, message, status, timestamps | Visible only to authorized participants and approved moderators when necessary. |
| Tokens | Ledger entries, amounts, type, description, related operation | User sees their own transactions; admin access is restricted and audited. |
| Subscription/payment request | Plan, amount, period, claimed reference, review state, reviewer metadata | User sees their own request; payment proof is private; public marketplace users see none of it. |
| Operational logs | Error category, route, request/correlation ID, timestamps | Minimize and redact. Never log secrets, auth headers, full message bodies, payment proof, or unnecessary personal data. |

### Data minimization and retention
- Collect only what is necessary for the stated feature.
- Set retention periods for inquiries, logs, payment records, and uploaded proof before launch; retain only what is needed for support, dispute handling, security, and legal obligations.
- Delete or anonymize data when the retention purpose ends, except records that must be retained under a documented obligation.
- Account deletion must explain effects on listings, saved items, messages, token history, and legally required records. Do not silently delete another participant's required transaction/audit record.
- Do not use private user data for unrelated analytics, profiling, or advertising without a clear lawful basis and appropriate notice/choice.

## 8. Security requirements

### 8.1 Authentication and sessions
- Use Supabase Auth for identity; never implement custom password storage.
- Keep email confirmation enabled where supported by the chosen signup policy.
- Require authentication for personal data and mutations.
- Validate authorization on every request, not only at route entry.
- Handle expired sessions and sign-out cleanly. Never put session/access tokens into URLs or analytics events.
- Use secure redirect allowlists for authentication flows; reject arbitrary redirect URLs.

### 8.2 PostgreSQL and Row Level Security (RLS)
- Enable RLS on every exposed table containing user data or application mutations.
- Define explicit SELECT/INSERT/UPDATE/DELETE policies for each role and data ownership rule.
- Public read access must be limited to approved public columns/rows; consider safe views or RPCs to avoid exposing private fields.
- Ensure insert policies validate `user_id = auth.uid()` or equivalent trusted ownership.
- Ensure update/delete policies validate current ownership and allowed state transitions.
- Restrict direct client writes to token balances, payment approvals, role flags, subscription status, audit records, and other privileged fields.
- Review grants separately from RLS. A broad table grant plus weak/missing RLS is not acceptable.
- Test policies with anonymous, ordinary user A, ordinary user B, owner, shop, and admin identities.
- Use SECURITY DEFINER RPCs only when necessary; fix `search_path`, fully qualify objects, validate inputs, and grant EXECUTE only to required roles.
- No database function should trust a client-provided UID as the actor identity.

### 8.3 Storage
- Use separate access policies/buckets for public listing images and private proof/documents.
- Validate content type, size, extension, and authorization; do not trust the filename or browser MIME header alone.
- Prevent path traversal and cross-user overwrite/delete.
- Use randomized object names; do not store credentials or private data in image metadata.
- Use signed URLs with short expiry for private files. Public listing images may be public only if product policy intentionally makes them public.
- Clean up orphaned uploads through a safe, ownership-aware process.

### 8.4 API keys, secrets, and API calls
- The Supabase publishable/anon key may be present in the browser only when it is intended for public clients and all tables/functions are secured by RLS and appropriate grants. It is not a substitute for authorization.
- Supabase service-role/secret keys, database passwords, JWT signing secrets, SMTP credentials, payment-provider secrets, webhook credentials, and scheduler secrets MUST stay in server-side environment/secret storage only.
- Never prefix a private secret with `VITE_`; Vite variables are bundled into the client.
- Store production secrets in Supabase Edge Function secrets or the relevant hosting provider's encrypted environment settings. Limit who can read/change them and rotate them if exposed.
- Keep `.env` files out of Git. Commit only a sanitized `.env.example` with placeholder names and no real values.
- Do not ask users to paste keys into chat, issue trackers, PR comments, logs, or documentation.
- Use authenticated Edge Functions/RPCs for privileged operations. Verify JWTs by default; only disable verification for a documented webhook/custom-auth case with cryptographic authentication and replay protection.
- Validate request schemas, lengths, allowed enum values, amount ranges, and state transitions on the server.
- Restrict CORS to expected application origins, but do not treat CORS as authentication.
- Apply rate limits/abuse controls to login-sensitive operations, publish, inquiry, upload, payment-request submission, and other expensive endpoints.
- Use timeouts, bounded pagination, and safe error handling. Do not return stack traces, SQL errors, provider responses containing secrets, or internal table structure to end users.
- External API calls must be made from trusted server-side code when they require secret credentials. Check TLS, provider signatures, webhook authenticity, timestamp/replay rules, and response schemas.
- Use idempotency keys for retryable mutations and verify provider/payment status from a trusted server-side source.
- Avoid sending personal data to third-party APIs unless required and disclosed.

### 8.5 Input and application security
- Validate all user-controlled inputs server-side; frontend validation is convenience only.
- Render user content as text by default; sanitize any permitted rich text.
- Protect against XSS, SQL injection, insecure direct object references, CSRF where cookie-based state-changing requests are used, open redirects, and mass assignment.
- Never spread arbitrary request bodies directly into database update objects.
- Keep dependencies updated and review dependency alerts.
- Apply secure HTTP headers at the hosting layer where compatible (Content-Security-Policy, frame protections, Referrer-Policy, nosniff, and appropriate transport security).
- Use generic public error messages and private diagnostic logs with redaction.
- Provide abuse reporting/moderation and protect private chat/contact flows against spam.

### 8.6 Admin security and audit
- Use a trusted role source and enforce admin access in database policies/functions.
- Remove reliance on frontend email comparisons as the sole admin control.
- Apply least privilege to admin tools and separate sensitive operations where feasible.
- Audit changes to roles, moderation, token grants, payment decisions, subscriptions, and destructive actions.
- Audit records should include actor, action, target ID, timestamp, outcome, and a minimal reason; avoid duplicating private payloads.
- Admins must not see passwords, auth tokens, private keys, or data unrelated to the task.

### 8.7 Incident response
- If a secret leaks, revoke/rotate it immediately, inspect access logs, remove it from current code and history where possible, and treat historical exposure as real.
- If user data is exposed, stop the affected path, preserve minimal investigation evidence, determine affected records, and follow applicable notification obligations.
- Maintain a documented recovery path and backup/restore process appropriate to the hosting plan.
- Do not claim the app is secure solely because a build passes.

## 9. Data flow — end to end

### 9.1 Public discovery
```text
Browser → React/Vite UI → Supabase client (publishable key + anonymous/auth session)
        → Postgres query/view with RLS and public visibility filters
        → minimum public listing fields → UI cards/details
```
The browser must never receive service-role credentials. The query returns only approved active/published/non-expired listing data.

### 9.2 Sign-in and profile
```text
Browser → Supabase Auth → session
        → app reads own minimal profile/role data
        → dashboard chooses Marketplace as initial view
        → every later data request is separately authorized by RLS/RPC/Edge Function
```
A valid session identifies a user; it does not grant access to every record.

### 9.3 Publish with image
```text
Form → client-side UX validation
     → authenticated Storage upload with bucket policy
     → trusted publish RPC/operation validates caller, fields, token balance and state
     → atomic token deduction + listing persistence (or a recoverable workflow)
     → listing ID/status returned
     → Marketplace and landing queries retrieve eligible listing
```
If a multi-step upload/publish fails, cleanup must not delete files owned/referenced by another listing. The database is the source of truth for publication state.

### 9.4 Save and inquiry
```text
Save action → authenticated insert/delete → RLS + unique constraint → user's Saved Items
Inquiry action → server validates listing and participants → authorized record → participants only
```
Neither flow returns unrelated profile records.

### 9.5 QR subscription and token grant
```text
User views supplied QR → pays in external UPI app
    → submits claimed reference / optional proof
    → private pending request
    → authorized reviewer checks trusted payment evidence
    → atomic approve operation with idempotency guard
    → payment status + subscription period + token ledger + audit
    → user sees own status and token balance
```
No callback exists merely because a QR was scanned. The workflow must never imply that a screenshot is verified automatically.

### 9.6 Failure and retries
- Display a pending state when outcome is uncertain.
- Retrying an operation must use an idempotency key or equivalent uniqueness guard.
- Do not repeat token deductions/grants for a completed operation.
- Log a correlation ID and safe error category, not credentials or full sensitive payloads.
- Provide an authorized reconciliation path for partial failures.

## 10. Non-functional requirements

### Performance
- Keep queries selective and paginated.
- Use image resizing/appropriate formats and lazy loading for below-the-fold images.
- Avoid duplicate requests and expensive rerenders.
- Use bounded dashboard queries and server-side aggregation where appropriate.
- Show skeleton/loading states for meaningful waits.

### Accessibility and UX
- Support keyboard navigation, visible focus, semantic labels, useful validation messages, and sufficient contrast.
- Respect `prefers-reduced-motion`.
- Use touch targets suitable for Android.
- Avoid overly cramped or overly spacious layouts.
- Prefer horizontal rails for compact discovery when they remain usable with keyboard and touch; don't make important content unreachable.
- Provide loading, empty, error, success, pending, and disabled states for asynchronous actions.
- Make destructive actions explicit and confirm irreversible deletion.
- Keep subscription terms, price, period, reward, and manual verification requirements visible before payment.

### Reliability and maintainability
- Reuse shared marketplace components, filters, card rendering, image handling, form primitives, and domain logic.
- Keep data access in hooks/services or trusted backend functions rather than duplicating it in presentation components.
- Use database migrations for schema changes and test them against a disposable/development database first.
- Keep automated build, type, policy, and SQL-flow tests.
- Maintain development/staging/production separation and avoid testing destructive operations on production data.

## 11. Analytics and observability

- Collect only product events necessary to measure reliability and usability (e.g., search performed, listing created, publish failed, inquiry submitted).
- Prefer aggregate counts and internal IDs over names, email addresses, phone numbers, precise addresses, message contents, and payment proof.
- Do not put access tokens, API keys, session cookies, full query payloads, private messages, or bank references in analytics.
- Restrict log access and define retention.
- Monitor failed publish/token operations, repeated authorization denials, upload errors, subscription review backlog, duplicate requests, and suspected abuse.
- Admin analytics must use aggregate/minimized data whenever detailed personal data is not required.

## 12. Release, testing, and acceptance gates

### Required test identities
Test anonymous access, ordinary user A, ordinary user B, room owner, shop/seller, and administrator. Use synthetic test data only.

### Security acceptance tests
- User A cannot read/update/delete User B's listings, saves, inquiries, messages, payment requests, or token records.
- Anonymous users cannot access private tables or private storage objects.
- Changing IDs in the browser or network request does not bypass authorization.
- Client cannot set role/admin flags, subscription approval, arbitrary token balance, or payment status.
- Private keys do not appear in built JavaScript, source maps, network responses, logs, or Git history.
- Public listing queries do not expose private contact fields or moderation notes.
- QR payment proof cannot be read by another user or anonymously.
- Replaying an approval request does not grant duplicate tokens or periods.
- Invalid file type/oversized upload, malformed input, and abusive request rates are handled safely.

### Product acceptance tests
- Landing and Marketplace display the same eligible newly published item where intended.
- Search includes locality and city; filters do not show unrelated results.
- Saved Items includes all supported categories.
- Owner CRUD cannot operate on another user's items.
- Expired/unpublished/rejected listings disappear from public discovery.
- Token deductions and grants match the configured rules and ledger.
- QR subscription is pending until authorized manual verification; approval grants 55 tokens exactly once under the current offer.
- UI clearly explains that QR payments and monthly renewals are manual.
- Dashboard behavior works on desktop and Android/mobile widths.

### Release gates
1. Review code and requirements.
2. Run build, unit/integration/SQL tests and security policy checks.
3. Apply migrations to development/staging and verify rollback/recovery plan.
4. Perform role-based manual smoke tests.
5. Review Supabase security/performance advisors and resolve launch-blocking findings.
6. Confirm required environment variables/secrets are configured in the right environment.
7. Deploy to preview/staging and verify the deployed URL.
8. Deploy production only with explicit release approval; confirm health and key user journeys afterward.
9. Update `docs/tasks.md` and `docs/memory.md` with actual results.

A passing CI job is not proof that production is deployed, RLS is correct, or payment status is reliable.

## 13. Explicit non-goals and deferred decisions

- No automatic recurring debits in QR-only mode.
- No automatic token grants based only on uploaded screenshots or client-provided transaction references.
- No collection of UPI PINs, OTPs, banking passwords, card numbers, or payment credentials.
- No exposing service-role keys, database passwords, provider secrets, or privileged APIs to the browser.
- No unrelated feature expansion while a focused task is in progress.
- No destructive production schema/data changes without a reviewed migration and explicit approval.
- Automatic payment gateway/mandate integration may be reconsidered only through a separate product decision, provider eligibility review, compliance check, and sandbox/UAT plan.

## 14. Open decisions to resolve before launch

- Confirm final listing categories and required fields against the current database schema.
- Confirm exact publishing token cost, permitted transaction types, expiry policy, and recovery behavior from database constraints and tests.
- Confirm QR image and payment recipient details through a secure, authorized configuration process; never hard-code an unverified QR.
- Define who may approve manual payments and how the reviewer verifies settlement independently.
- Define subscription duration, what “active” unlocks, renewal reminders, late payment handling, refund/cancellation rules, and retention for payment evidence.
- Define account deletion/data export and user support workflows.
- Audit actual RLS policies, Storage policies, RPC grants, admin authorization, rate limits, and deployment secrets before calling the app production-ready.

## 15. Glossary

- **RLS:** PostgreSQL Row Level Security, used to constrain which rows a database role/user can access.
- **RPC:** A database function called through a controlled API interface.
- **Edge Function:** Server-side function for authenticated/privileged logic and external API calls.
- **Publishable key:** Client-visible project identifier/key intended for public clients; safe use depends on strict RLS and grants.
- **Service-role key:** Privileged server credential that bypasses normal RLS protections; must never be exposed to the client.
- **Idempotency:** A retry of the same logical operation has the same effect as running it once.
- **UAT:** User Acceptance Testing in a non-production environment.
- **Personal data:** Information relating to an identifiable person, including contact details, private messages, and account-linked activity.
