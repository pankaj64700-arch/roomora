# RoomOra — Engineering, Security and Privacy Rules

> **Version:** 2.0  
> **Aligned with:** `docs/prd.md` v2.0 and `docs/architecture.md` v2.0  
> These are mandatory project constraints, not optional suggestions.

## 1. Scope and workflow
1. Work on one clearly defined task at a time.
2. Do not silently bundle unrelated features or perform destructive production changes.
3. Inspect the current implementation, schema, policies and callers before changing a feature.
4. Preserve working behavior unless the approved requirement explicitly changes it.
5. Write or update acceptance tests for behavior/security changes.
6. Use migrations for schema and policy changes; validate against a development/disposable database before production.
7. Report precisely what changed, what was tested, what remains unverified and whether it was deployed.

## 2. Product source of truth
8. Follow `docs/prd.md`, `docs/architecture.md`, `docs/design.md`, `docs/rules.md`, and `docs/tasks.md`.
9. Keep this division of responsibility: PRD = required behavior; architecture = technical boundaries/data flow; design = UI system; rules = mandatory engineering constraints; tasks = active work; memory = durable decisions/history.
10. Update affected documentation when a product decision, role, permission, payment flow, token rule or data lifecycle changes.
11. Never mark a task complete based only on intent, generated code or a passing build.

## 3. Reuse and code quality
12. Reuse shared marketplace category definitions, filters, cards, image resolution, hooks and CRUD logic.
13. Reuse shared UI primitives and design tokens before creating one-off implementations.
14. Keep presentation, data orchestration and trusted business operations separated.
15. Avoid duplicate business logic, magic values and competing implementations.
16. Remove obsolete code only after the replacement is verified and references are checked.
17. Use descriptive focused commits and never overwrite a file using a stale content SHA.

## 4. Authentication and authorization
18. Supabase Auth is the identity source; never store passwords or build custom password handling.
19. Treat all browser input, local state, hidden buttons, route guards and client-supplied IDs as untrusted.
20. Enforce ownership/participant/role checks in RLS or trusted server-side code for every read and mutation.
21. Never use a frontend email comparison as the only admin authorization mechanism.
22. Never trust a client-provided user ID to identify the actor; use the verified JWT identity / `auth.uid()`.
23. Default to deny when policy, role or ownership is ambiguous.
24. Review table grants and RLS together. Every exposed user-data table needs deliberate grants and explicit policies.
25. Public reads must expose only approved fields and active/published/non-expired records. Avoid `SELECT *` for public responses when private columns could be present.
26. Prevent self-inquiry unless the product requirement explicitly allows it; prevent cross-user reads of inquiries, saves, payment requests and private contacts.

## 5. Database, transactions and tokens
27. Validate critical business rules in database constraints/functions or trusted server code, not only in React.
28. Client code must not set its own role, admin flag, subscription approval, arbitrary token balance, or payment verification status.
29. Token deductions/grants and associated business state must be atomic or modeled as a recoverable state machine.
30. Every retryable financial/token mutation must be idempotent or protected by a unique business key.
31. Never grant subscription tokens based only on a QR scan, screenshot, submitted reference, frontend state or untrusted webhook.
32. A manual QR payment remains pending until an authorized reviewer checks independent trusted evidence.
33. Correct historical ledger mistakes with an auditable compensating transaction rather than silently rewriting history.
34. Enforce allowed transaction types and amount semantics with database constraints.
35. Do not apply destructive production migrations without explicit approval, a reviewed recovery plan and appropriate backup/recovery checks.

## 6. API keys, secrets and network calls
36. Only a publishable client key intended for browser use may be included in frontend configuration, and only when RLS/grants are correctly enforced.
37. Never expose Supabase service-role/secret keys, database passwords, JWT signing secrets, webhook secrets or provider private credentials in browser bundles, source maps, public logs, GitHub, screenshots, chat or docs.
38. Never use a `VITE_*` variable for a private secret; Vite exposes such variables to browser code.
39. Keep `.env` and real credentials out of Git. Use sanitized placeholder values in example files.
40. Store server secrets in the hosting platform's encrypted environment/secret store with least-privilege access; rotate credentials immediately if exposed.
41. Verify JWTs in Edge Functions by default. A webhook may use an alternate provider-signature design only when documented, verified, and protected against replay.
42. Validate request shape, field length, enums, amount ranges, state transitions, file limits and caller authorization server-side.
43. Use timeouts, bounded pagination, safe errors and rate limits on abuse-prone/expensive operations.
44. CORS is not authentication. Restrict origins where possible, but enforce authorization independently.
45. Verify external API/webhook signatures and provider status before mutating trusted state.
46. Do not return stack traces, raw SQL/provider internals or sensitive columns to the browser.
47. Never ask users to paste secrets into ChatGPT, issues, PRs, logs or documentation.

## 7. Storage and personal data
48. Separate public listing images from private payment proofs/documents.
49. Enforce object upload/read/update/delete permissions; never trust a supplied storage path as proof of ownership.
50. Validate upload size/type, use safe randomized object names, and clean up orphaned objects without affecting other users' files.
51. Minimize collection and exposure of personal data; expose contact details only when required for an authorized user journey.
52. Never place private contact details, payment screenshots, auth tokens, API keys or unnecessary message content in logs or analytics.
53. Define and follow retention/deletion rules; preserve only records required for documented product, support, security or legal purposes.
54. Use synthetic user data in tests; do not commit real customer information.

## 8. Manual QR subscription rules
55. QR-only mode supports user-initiated payment and manual verification; it does not automatically debit monthly payments.
56. Clearly show price, duration, benefits, token reward, renewal method and pending-verification status before/after payment.
57. The current discussed offer is ₹10/month and 55 tokens (50 base + 5 bonus) only after verified approval; keep the configuration and user-facing terms consistent.
58. Proof/reference submissions are untrusted and must be private. Restrict proof access to the user and authorized reviewers.
59. Approval must verify settlement independently and atomically record payment decision, subscription period, audit and token grant with duplicate protection.
60. PhonePe gateway/AutoPay code on the draft branch must not be enabled or deployed for QR-only mode. Removing or archiving that code is a separate reviewed change, not an excuse to delete audit records or production data.
61. Do not claim full automation or successful payment verification without a real verified integration and test evidence.

## 9. UX and accessibility
62. Every async operation needs appropriate loading, error, success, pending and disabled states.
63. Empty states must be intentional; do not render blank category sections.
64. Use shared image fallbacks and reusable UI components.
65. Keep Android touch targets comfortable, keyboard focus visible, controls labeled, and motion respectful of `prefers-reduced-motion`.
66. Use design tokens; do not introduce arbitrary global colors/spacing/motion without need.
67. Use semantic links for navigation and buttons for actions; preserve SPA routing/history.
68. Never expose raw backend errors to end users.

## 10. Verification and release
69. Run build, type checks, migrations/SQL tests, policy tests and relevant UI smoke tests.
70. Test anonymous, user A, user B, owner/seller and admin permissions.
71. Verify direct API access and altered IDs, not only UI interactions.
72. Review Supabase security/performance advisories after policy/schema changes.
73. Verify the actual deployment separately from CI. Do not claim deployment success unless the deployed URL/status was checked.
74. Update task tracking and project memory with real results and unresolved risks.
75. Do not label RoomOra production-ready until critical authorization, storage, secret, token, and payment-verification requirements have evidence-backed test results.
